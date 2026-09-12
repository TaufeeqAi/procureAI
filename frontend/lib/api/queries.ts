import { apiGet, isApiNotFound } from "@/lib/api/client";
import { currentUser } from "@/lib/mock";
import { heroNegotiationDraft } from "@/lib/mock/ai-recommendations";
import type {
  NavCounts,
  PRDetailData,
  PRTimelineData,
  ProcurementDashboardData,
  PurchaseRequisition,
  RequirementValidation,
} from "@/types/procurement";
import type { Supplier, SupplierDetailData, SupplierShortlistCandidate } from "@/types/supplier";
import type { RFQ, SupplierResponseThread } from "@/types/rfq";
import type { Quote, QuoteComparisonData } from "@/types/quote";
import type { POListItem, PurchaseOrder } from "@/types/order";
import type { Delivery } from "@/types/delivery";
import type { AgentRun, NegotiationDraft, ProcurementRecommendation } from "@/types/ai";
import type { ProcurementTruth, WhatIfResponse } from "@/types/intelligence";
import type { NotificationEvent } from "@/types/common";

export type RequisitionFilter = "all" | "awaiting-supplier" | "awaiting-decision" | "exceptions";

type PipelineStage = { label: string; value: number; max: number };

function encodePathSegment(value: string): string {
  return encodeURIComponent(value);
}

function withQuery(path: string, query: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, value);
  }
  const serialized = params.toString();
  return serialized ? `${path}?${serialized}` : path;
}

export async function getDashboardData(): Promise<ProcurementDashboardData> {
  return apiGet<ProcurementDashboardData>("/dashboard");
}

export async function getNavCounts(): Promise<NavCounts> {
  return apiGet<NavCounts>("/nav-counts");
}

export async function getProcurementPipeline(): Promise<PipelineStage[]> {
  const [requisitions, rfqs, purchaseOrders] = await Promise.all([
    listRequisitions(),
    listRFQs(),
    listPurchaseOrders(),
  ]);

  const max = Math.max(requisitions.length, 1);
  const decisions = requisitions.filter((pr) =>
    ["ANALYSIS_READY", "AWAITING_APPROVAL", "APPROVED", "PO_CREATED", "FULFILLMENT", "COMPLETED"].includes(pr.status),
  ).length;

  const responseCount = rfqs.reduce(
    (count, rfq) => count + rfq.recipients.filter((recipient) => recipient.status === "RESPONDED").length,
    0,
  );

  return [
    { label: "PRs", value: requisitions.length, max },
    { label: "RFQs", value: rfqs.length, max },
    { label: "Responses", value: responseCount, max },
    { label: "Decisions", value: decisions, max },
    { label: "POs", value: purchaseOrders.length, max },
  ];
}

export async function listRequisitions(filter?: RequisitionFilter): Promise<PurchaseRequisition[]> {
  const apiFilter = filter && filter !== "all" ? filter : undefined;
  return apiGet<PurchaseRequisition[]>(withQuery("/requisitions", { filter: apiFilter }));
}

export async function filterRequisitions(filter: RequisitionFilter): Promise<PurchaseRequisition[]> {
  return listRequisitions(filter);
}

export async function getRequisitionDetail(prNumber: string): Promise<PRDetailData | undefined> {
  try {
    return await apiGet<PRDetailData>(`/requisitions/${encodePathSegment(prNumber)}`);
  } catch (error) {
    if (isApiNotFound(error)) return undefined;
    throw error;
  }
}

export async function getRequisitionByNumber(prNumber: string): Promise<PurchaseRequisition | undefined> {
  const detail = await getRequisitionDetail(prNumber);
  return detail?.requisition;
}

export async function getRequirementValidationFor(prNumber: string): Promise<RequirementValidation | undefined> {
  try {
    return await apiGet<RequirementValidation>(`/requisitions/${encodePathSegment(prNumber)}/requirement`);
  } catch (error) {
    if (isApiNotFound(error)) return undefined;
    throw error;
  }
}

export async function getPRTimelineFor(prNumber: string): Promise<PRTimelineData | undefined> {
  try {
    return await apiGet<PRTimelineData>(`/requisitions/${encodePathSegment(prNumber)}/timeline`);
  } catch (error) {
    if (isApiNotFound(error)) return undefined;
    throw error;
  }
}

export async function getProcurementTruthFor(prNumber: string): Promise<ProcurementTruth | undefined> {
  try {
    return await apiGet<ProcurementTruth>(`/requisitions/${encodePathSegment(prNumber)}/intelligence`);
  } catch (error) {
    if (isApiNotFound(error)) return undefined;
    throw error;
  }
}

export async function getSupplierShortlistFor(prNumber: string): Promise<SupplierShortlistCandidate[]> {
  const truth = await getProcurementTruthFor(prNumber);
  if (!truth) return [];

  const [suppliers, comparison] = await Promise.all([listSuppliers(), getQuoteComparisonFor(prNumber)]);

  const quoteRows = comparison?.rows ?? [];
  const quoteBySupplier = new Map(quoteRows.map((row) => [row.quote.supplierId, row]));

  return truth.suppliers
    .filter((assessment) => suppliers.some((supplier) => supplier.id === assessment.supplierId && supplier.approvalStatus === "APPROVED"))
    .sort((a, b) => b.overallScore - a.overallScore || a.supplierName.localeCompare(b.supplierName))
    .map((assessment, index) => {
      const supplier = suppliers.find((item) => item.id === assessment.supplierId)!;
      const row = quoteBySupplier.get(assessment.supplierId);

      const reasons = [
        `Deterministic score ${assessment.overallScore.toFixed(1)}`,
        `${assessment.riskLevel} risk`,
      ];

      if (assessment.priceVariancePercent !== undefined) {
        const direction = assessment.priceVariancePercent <= 0 ? "below" : "above";
        reasons.push(`Quote ${Math.abs(assessment.priceVariancePercent).toFixed(1)}% ${direction} historical benchmark`);
      }

      return {
        supplier,
        rank: index + 1,
        deterministicScore: assessment.overallScore,
        quotedUnitPrice: row?.quote.unitPrice,
        historicalMedianPrice: truth.benchmark.benchmark,
        reasons,
      } satisfies SupplierShortlistCandidate;
    });
}

export async function getRFQsFor(prNumber: string): Promise<RFQ[]> {
  const rfqs = await listRFQs();
  return rfqs.filter((rfq) => rfq.prNumber === prNumber);
}

export async function getRFQDetail(rfqNumber: string): Promise<RFQ | undefined> {
  try {
    return await apiGet<RFQ>(`/rfqs/${encodePathSegment(rfqNumber)}`);
  } catch (error) {
    if (isApiNotFound(error)) return undefined;
    throw error;
  }
}

export async function getThreadsFor(prNumber: string): Promise<SupplierResponseThread[]> {
  try {
    return await apiGet<SupplierResponseThread[]>(`/requisitions/${encodePathSegment(prNumber)}/communication`);
  } catch (error) {
    if (isApiNotFound(error)) return [];
    throw error;
  }
}

export async function getThreadsForRFQNumber(rfqNumber: string): Promise<SupplierResponseThread[]> {
  const rfq = await getRFQDetail(rfqNumber);
  if (!rfq) return [];
  const threads = await getThreadsFor(rfq.prNumber);
  return threads.filter((thread) => thread.rfqId === rfq.id);
}

export async function getQuoteComparisonFor(prNumber: string): Promise<QuoteComparisonData | undefined> {
  try {
    return await apiGet<QuoteComparisonData>(`/requisitions/${encodePathSegment(prNumber)}/quotes`);
  } catch (error) {
    if (isApiNotFound(error)) return undefined;
    throw error;
  }
}

// NEW: Helper to extract just the Quote objects for a specific PR
export async function getQuotesForPR(prNumber: string): Promise<Quote[]> {
  const comparison = await getQuoteComparisonFor(prNumber);
  if (!comparison) return [];
  return comparison.rows.map((row) => row.quote);
}

export async function getRecommendationFor(prNumber: string): Promise<ProcurementRecommendation | undefined> {
  try {
    return await apiGet<ProcurementRecommendation>(`/requisitions/${encodePathSegment(prNumber)}/decision`);
  } catch (error) {
    if (isApiNotFound(error)) return undefined;
    throw error;
  }
}

export async function getWhatIfFor(
  prNumber: string,
  params?: { requiredDate?: string; quantity?: number; weights?: { price: number; quality: number; delivery: number; commercial: number; risk: number } },
): Promise<WhatIfResponse | undefined> {
  try {
    const query = new URLSearchParams();
    if (params?.requiredDate) query.set("required_date", params.requiredDate);
    if (params?.quantity) query.set("quantity", String(params.quantity));
    if (params?.weights) {
      for (const [key, value] of Object.entries(params.weights)) query.set(key, String(value));
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return await apiGet<WhatIfResponse>(`/requisitions/${encodePathSegment(prNumber)}/what-if${suffix}`);
  } catch (error) {
    if (isApiNotFound(error)) return undefined;
    throw error;
  }
}

export async function getNegotiationDraftFor(prNumber: string): Promise<NegotiationDraft | undefined> {
  if (prNumber !== "PR-2026-00983") return undefined;
  return heroNegotiationDraft;
}

export async function getAgentRunsFor(prNumber: string): Promise<AgentRun[]> {
  try {
    return await apiGet<AgentRun[]>(`/requisitions/${encodePathSegment(prNumber)}/agent-runs`);
  } catch (error) {
    if (isApiNotFound(error)) return [];
    throw error;
  }
}

export async function listAllAgentRuns(): Promise<AgentRun[]> {
  return apiGet<AgentRun[]>("/ai/activity");
}

export async function listSuppliers(): Promise<Supplier[]> {
  return apiGet<Supplier[]>("/suppliers");
}

export async function getSupplierDetailBySlug(slug: string): Promise<SupplierDetailData | undefined> {
  try {
    return await apiGet<SupplierDetailData>(`/suppliers/${encodePathSegment(slug)}`);
  } catch (error) {
    if (isApiNotFound(error)) return undefined;
    throw error;
  }
}

export async function listRFQs(): Promise<RFQ[]> {
  return apiGet<RFQ[]>("/rfqs");
}

export async function listQuotes(): Promise<Quote[]> {
  return apiGet<Quote[]>("/quotes");
}

export async function getQuoteDetail(quoteReference: string): Promise<Quote | undefined> {
  try {
    return await apiGet<Quote>(`/quotes/${encodePathSegment(quoteReference)}`);
  } catch (error) {
    if (isApiNotFound(error)) return undefined;
    throw error;
  }
}

export async function listPurchaseOrders(): Promise<POListItem[]> {
  return apiGet<POListItem[]>("/purchase-orders");
}

export async function getPurchaseOrderDetail(poNumber: string): Promise<PurchaseOrder | undefined> {
  try {
    return await apiGet<PurchaseOrder>(`/purchase-orders/${encodePathSegment(poNumber)}`);
  } catch (error) {
    if (isApiNotFound(error)) return undefined;
    throw error;
  }
}

export async function listDeliveries(): Promise<Delivery[]> {
  return apiGet<Delivery[]>("/deliveries");
}

export async function getDeliveryDetail(poNumber: string): Promise<Delivery | undefined> {
  try {
    return await apiGet<Delivery>(`/deliveries/${encodePathSegment(poNumber)}`);
  } catch (error) {
    if (isApiNotFound(error)) return undefined;
    throw error;
  }
}

export async function listNotifications(): Promise<NotificationEvent[]> {
  return apiGet<NotificationEvent[]>("/notifications");
}

export interface SearchResults {
  requisitions: PurchaseRequisition[];
  suppliers: Supplier[];
  purchaseOrders: POListItem[];
  quotes: Quote[];
}

export async function search(query: string): Promise<SearchResults> {
  const trimmed = query.trim();
  if (!trimmed) return { requisitions: [], suppliers: [], purchaseOrders: [], quotes: [] };
  return apiGet<SearchResults>(withQuery("/search", { q: trimmed }));
}

export { currentUser };