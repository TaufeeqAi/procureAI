import { computeLandedCost } from "@/lib/utils/pricing";
import { suppliers, getSupplier } from "@/lib/mock/suppliers";
import { allRequisitions, getRequisition, heroRequirementValidation } from "@/lib/mock/requisitions";
import { heroQuotes, getQuotesForPR } from "@/lib/mock/quotes";
import { rfqs, getRFQsForPR, getRFQ } from "@/lib/mock/rfqs";
import { heroThreads, getThreadsForRFQ } from "@/lib/mock/communications";
import { poListItems, getPurchaseOrder } from "@/lib/mock/purchase-orders";
import { deliveries, getDelivery } from "@/lib/mock/deliveries";
import { notifications } from "@/lib/mock/notifications";
import { heroAgentRuns, getAgentRunsForPR } from "@/lib/mock/ai-activity";
import { heroRecommendation, heroWhatIfBaseline, heroWhatIfEarlierDelivery, heroNegotiationDraft } from "@/lib/mock/ai-recommendations";
import { dashboardData, navCounts, procurementPipeline } from "@/lib/mock/dashboard";
import type {
  PRDetailData, PRTimelineData, RequirementValidation, SourcingState, SupplierSummary, WorkflowState, WorkflowStep, PRStatus,
} from "@/types/procurement";
import type { SupplierDetailData, SupplierShortlistCandidate } from "@/types/supplier";
import type { QuoteComparisonData, QuoteComparisonRow } from "@/types/quote";

/**
 * The mock "backend." Every page in this phase reads through these
 * functions rather than importing dataset files directly — the same
 * functions Phase 3 replaces with real `fetch` calls, per
 * docs/architecture/roadmap.md ("mock.getPR() → api.getPR() with no
 * component changes"). Nothing here is async yet because there's nothing
 * to await; the signatures are deliberately synchronous rather than
 * fake-async, since adding artificial Promises now would be simulating a
 * constraint that doesn't exist yet and would just add noise to callers.
 */

const WORKFLOW_STEPS: { key: PRStatus; label: string }[] = [
  { key: "RECEIVED", label: "Received" },
  { key: "VALIDATING", label: "Validated" },
  { key: "READY_FOR_SOURCING", label: "Sourcing" },
  { key: "RFQ_IN_PROGRESS", label: "RFQ" },
  { key: "RESPONSES_RECEIVED", label: "Quotes" },
  { key: "ANALYSIS_READY", label: "Decision" },
  { key: "AWAITING_APPROVAL", label: "Approval" },
  { key: "APPROVED", label: "Approved" },
  { key: "PO_CREATED", label: "PO" },
];

export function getDashboardData() {
  return dashboardData;
}

export function getNavCounts() {
  return navCounts;
}

export function getProcurementPipeline() {
  return procurementPipeline;
}

export function listRequisitions() {
  return allRequisitions;
}

export type RequisitionFilter = "all" | "awaiting-supplier" | "awaiting-decision" | "exceptions";

/** Backs the sidebar's status-filtered nav links (Awaiting Supplier,
 *  Awaiting Decision, Exceptions) — all reads of the same underlying list,
 *  never a separate dataset, so the counts here and in NavCounts can never
 *  drift apart. */
export function filterRequisitions(filter: RequisitionFilter) {
  switch (filter) {
    case "awaiting-supplier":
      return allRequisitions.filter((pr) => pr.status === "RFQ_IN_PROGRESS");
    case "awaiting-decision":
      return allRequisitions.filter((pr) => pr.status === "ANALYSIS_READY" || pr.status === "RESPONSES_RECEIVED");
    case "exceptions":
      return allRequisitions.filter((pr) => pr.exceptions.length > 0);
    default:
      return allRequisitions;
  }
}

export function getRequisitionByNumber(prNumber: string) {
  return getRequisition(prNumber);
}

function buildWorkflowState(status: PRStatus): WorkflowState {
  const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.key === status);
  const steps: WorkflowStep[] = WORKFLOW_STEPS.map((step, index) => ({
    key: step.key,
    label: step.label,
    completed: currentIndex >= 0 && index < currentIndex,
    current: index === currentIndex,
  }));
  return { steps };
}

export function getRequisitionDetail(prNumber: string): PRDetailData | undefined {
  const requisition = getRequisition(prNumber);
  if (!requisition) return undefined;

  const prRfqs = getRFQsForPR(requisition.id);
  const respondedCount = prRfqs.flatMap((r) => r.recipients).filter((r) => r.status === "RESPONDED").length;
  const contactedCount = prRfqs.flatMap((r) => r.recipients).length;

  const sourcingState: SourcingState = {
    eligibleSupplierCount: suppliers.filter((s) => s.approvalStatus === "APPROVED").length,
    contactedSupplierCount: contactedCount,
    respondedSupplierCount: respondedCount,
    comparableHistoricalPurchases: requisition.id === "pr-00983" ? 12 : 4,
  };

  const quotes = getQuotesForPR(requisition.id);
  const supplierSummary: SupplierSummary = {
    highlights:
      quotes.length > 0
        ? [
            {
              label: "BEST_PRICE",
              supplierId: quotes.reduce((best, q) => (q.unitPrice.amount < best.unitPrice.amount ? q : best)).supplierId,
              supplierName: quotes.reduce((best, q) => (q.unitPrice.amount < best.unitPrice.amount ? q : best)).supplierName,
              value: `₹${quotes.reduce((best, q) => (q.unitPrice.amount < best.unitPrice.amount ? q : best)).unitPrice.amount}`,
            },
            {
              label: "BEST_DELIVERY",
              supplierId: "sup-abc",
              supplierName: "ABC Precision",
              value: "96% OTD",
            },
            {
              label: "BEST_OVERALL",
              supplierId: "sup-abc",
              supplierName: "ABC Precision",
              value: "94.2 score",
            },
          ]
        : [],
  };

  return {
    requisition,
    requirementValidation: requisition.id === "pr-00983"
      ? heroRequirementValidation
      : ({ prId: requisition.id, fields: [], blockingIssues: [], evaluatedAt: requisition.updatedAt } as RequirementValidation),
    sourcingState,
    supplierSummary,
    workflowState: buildWorkflowState(requisition.status),
  };
}

export function getRequirementValidationFor(prNumber: string) {
  const requisition = getRequisition(prNumber);
  if (!requisition) return undefined;
  return requisition.id === "pr-00983" ? heroRequirementValidation : undefined;
}

export function getSupplierShortlistFor(prNumber: string): SupplierShortlistCandidate[] {
  const requisition = getRequisition(prNumber);
  if (!requisition) return [];
  const quotes = getQuotesForPR(requisition.id);
  const candidateIds = quotes.length > 0 ? quotes.map((q) => q.supplierId) : ["sup-abc", "sup-xyz", "sup-lmn"];

  return candidateIds
    .map((id) => suppliers.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .sort((a, b) => (b.scoreBreakdown?.overall ?? 0) - (a.scoreBreakdown?.overall ?? 0))
    .map((supplier, index) => {
      const quote = quotes.find((q) => q.supplierId === supplier.id);
      return {
        supplier,
        rank: index + 1,
        aiScore: supplier.scoreBreakdown?.overall ?? 0,
        quotedUnitPrice: quote?.unitPrice,
        historicalMedianPrice: supplier.performance?.averageUnitPrice,
        reasons:
          supplier.id === "sup-abc"
            ? ["Strong quality", "Strong delivery", "Competitive price"]
            : supplier.riskLevel === "HIGH"
              ? ["Lowest price", "Weaker delivery history"]
              : ["Approved supplier", "Moderate risk"],
      };
    });
}

export function getRFQsFor(prNumber: string) {
  const requisition = getRequisition(prNumber);
  if (!requisition) return [];
  return getRFQsForPR(requisition.id);
}

export function getRFQDetail(rfqNumber: string) {
  return getRFQ(rfqNumber);
}

export function getThreadsFor(prNumber: string) {
  const requisition = getRequisition(prNumber);
  if (!requisition || requisition.id !== "pr-00983") return [];
  return heroThreads;
}

export function getThreadsForRFQNumber(rfqNumber: string) {
  const rfq = getRFQ(rfqNumber);
  if (!rfq) return [];
  return getThreadsForRFQ(rfq.id);
}

export function getQuoteComparisonFor(prNumber: string): QuoteComparisonData | undefined {
  const requisition = getRequisition(prNumber);
  if (!requisition) return undefined;
  const quotes = getQuotesForPR(requisition.id);
  if (quotes.length === 0) return undefined;

  const rows: QuoteComparisonRow[] = quotes.map((quote) => {
    const supplier = getSupplier(quote.supplierId);
    return {
      quote,
      landedCost: computeLandedCost(quote.quantity, quote.unitPrice.amount, quote.freight.amount, quote.taxRatePercent),
      qualityAcceptanceRate: supplier?.performance?.qualityAcceptanceRate ?? 0,
      onTimeDeliveryRate: supplier?.performance?.onTimeDeliveryRate ?? 0,
      riskLevel: supplier?.riskLevel ?? "MEDIUM",
      aiScore: supplier?.scoreBreakdown?.overall ?? 0,
    };
  });

  return {
    prId: requisition.id,
    rows,
    aiInterpretation:
      requisition.id === "pr-00983"
        ? "PQR offers the lowest nominal cost but has materially weaker historical delivery and quality performance. ABC provides the strongest overall procurement profile."
        : undefined,
    generatedAt: "2026-09-04T10:52:44+05:30",
  };
}

export function getRecommendationFor(prNumber: string) {
  const requisition = getRequisition(prNumber);
  if (!requisition || requisition.id !== "pr-00983") return undefined;
  return heroRecommendation;
}

export function getWhatIfBaselineFor(prNumber: string) {
  const requisition = getRequisition(prNumber);
  if (!requisition || requisition.id !== "pr-00983") return undefined;
  return heroWhatIfBaseline;
}

export function getWhatIfEarlierDeliveryFor(prNumber: string) {
  const requisition = getRequisition(prNumber);
  if (!requisition || requisition.id !== "pr-00983") return undefined;
  return heroWhatIfEarlierDelivery;
}

export function getNegotiationDraftFor(prNumber: string) {
  const requisition = getRequisition(prNumber);
  if (!requisition || requisition.id !== "pr-00983") return undefined;
  return heroNegotiationDraft;
}

export function getAgentRunsFor(prNumber: string) {
  const requisition = getRequisition(prNumber);
  if (!requisition) return [];
  return getAgentRunsForPR(requisition.id);
}

export function listAllAgentRuns() {
  return heroAgentRuns;
}

export function getPRTimelineFor(prNumber: string): PRTimelineData | undefined {
  const requisition = getRequisition(prNumber);
  if (!requisition) return undefined;
  const runs = getAgentRunsForPR(requisition.id);

  const entries: PRTimelineData["entries"] = [
    {
      id: "tl-1",
      label: "PR received",
      description: `${requisition.material.materialName} requisition entered the queue`,
      occurredAt: requisition.createdAt,
    },
    ...runs.map((run) => ({
      id: run.id,
      label: run.label,
      description: run.summary,
      occurredAt: run.completedAt ?? run.startedAt,
    })),
  ].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

  return { prId: requisition.id, entries };
}

export function listSuppliers() {
  return suppliers;
}

export function getSupplierDetailBySlug(slug: string): SupplierDetailData | undefined {
  const supplier = getSupplier(slug);
  if (!supplier || !supplier.performance || !supplier.scoreBreakdown) return undefined;

  return {
    supplier,
    performance: supplier.performance,
    scoreBreakdown: supplier.scoreBreakdown,
    trends: {
      price: supplier.id === "sup-abc" ? "STABLE" : supplier.id === "sup-pqr" ? "DECLINING" : "IMPROVING",
      delivery: supplier.id === "sup-pqr" ? "DECLINING" : "IMPROVING",
      quality: "STABLE",
    },
    priceHistory:
      supplier.id === "sup-abc"
        ? [
            { date: "2026-03-14", unitPrice: { currency: "INR", amount: 1210 }, poReference: "PO-2026-00192" },
            { date: "2026-05-02", unitPrice: { currency: "INR", amount: 1190 }, poReference: "PO-2026-00271" },
            { date: "2026-06-20", unitPrice: { currency: "INR", amount: 1205 }, poReference: "PO-2026-00318" },
            { date: "2026-09-04", unitPrice: { currency: "INR", amount: 1180 }, poReference: "ABC-9841" },
          ]
        : [],
    recentTransactions:
      supplier.id === "sup-abc"
        ? [
            { id: "t1", poReference: "PO-2026-00291", materialName: "Bearing Housing", unitPrice: { currency: "INR", amount: 1170 }, deliveredOnTime: true, qualityAccepted: true, occurredAt: "2026-07-30" },
            { id: "t2", poReference: "PO-2026-00271", materialName: "Bearing Housing", unitPrice: { currency: "INR", amount: 1195 }, deliveredOnTime: true, qualityAccepted: true, occurredAt: "2026-05-02" },
            { id: "t3", poReference: "PO-2026-00254", materialName: "Gear Component", unitPrice: { currency: "INR", amount: 1188 }, deliveredOnTime: false, qualityAccepted: true, occurredAt: "2026-03-18" },
          ]
        : [],
  };
}

export function listRFQs() {
  return rfqs;
}

export function listQuotes() {
  return heroQuotes;
}

export function getQuoteDetail(quoteReference: string) {
  return heroQuotes.find((q) => q.quoteReference === quoteReference);
}

export function listPurchaseOrders() {
  return poListItems;
}

export function getPurchaseOrderDetail(poNumber: string) {
  return getPurchaseOrder(poNumber);
}

export function listDeliveries() {
  return deliveries;
}

export function getDeliveryDetail(poNumber: string) {
  return getDelivery(poNumber);
}

export function listNotifications() {
  return notifications;
}

export interface SearchResults {
  requisitions: typeof allRequisitions;
  suppliers: typeof suppliers;
  purchaseOrders: typeof poListItems;
  quotes: typeof heroQuotes;
}

export function search(query: string): SearchResults {
  const q = query.trim().toLowerCase();
  if (!q) return { requisitions: [], suppliers: [], purchaseOrders: [], quotes: [] };

  return {
    requisitions: allRequisitions.filter(
      (pr) => pr.prNumber.toLowerCase().includes(q) || pr.material.materialName.toLowerCase().includes(q) || pr.material.partCode?.toLowerCase().includes(q),
    ),
    suppliers: suppliers.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)),
    purchaseOrders: poListItems.filter((po) => po.poNumber.toLowerCase().includes(q) || po.supplierName.toLowerCase().includes(q)),
    quotes: heroQuotes.filter((qt) => qt.quoteReference.toLowerCase().includes(q) || qt.supplierName.toLowerCase().includes(q)),
  };
}
