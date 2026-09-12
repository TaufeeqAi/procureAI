import type { Actor, EvidenceReference, ISODate, ISODateTime, Money, RiskLevel } from "@/types/common";

/**
 * The PR lifecycle. The frontend must always reflect server state here —
 * no client ever infers a later status than the backend has confirmed.
 * See docs/architecture/state-machines.md.
 */
export type PRStatus =
  | "RECEIVED"
  | "VALIDATING"
  | "READY_FOR_SOURCING"
  | "RFQ_IN_PROGRESS"
  | "RESPONSES_RECEIVED"
  | "ANALYSIS_READY"
  | "AWAITING_APPROVAL"
  | "APPROVED"
  | "PO_CREATED"
  | "FULFILLMENT"
  | "COMPLETED";

export type PRException =
  | "VALIDATION_FAILED"
  | "NO_SUPPLIER_RESPONSE"
  | "QUOTE_INVALID"
  | "DELIVERY_RISK"
  | "APPROVAL_REJECTED"
  | "EXTERNAL_SYSTEM_FAILURE";

export interface MaterialRequirement {
  materialName: string;
  partCode?: string;
  quantity: number;
  unit: string;
  application?: string;
  drawingReference?: string;
  drawingRevisionAvailable: boolean;
}

export interface PurchaseRequisition {
  id: string;
  prNumber: string;
  material: MaterialRequirement;
  requiredDate: ISODate;
  requestingDepartment: string;
  status: PRStatus;
  exceptions: PRException[];
  estimatedValue?: Money;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  /** True once a PR has moved past ANALYSIS_READY at least once, even if
   *  the buyer later requests changes — used to distinguish "never
   *  analyzed" empty states from "analysis stale" ones. */
  hasBeenAnalyzed: boolean;
}

export interface RequirementValidationField {
  field: keyof MaterialRequirement | "requiredDate";
  label: string;
  status: "CONFIRMED" | "INFERRED" | "MISSING";
  /** 0–1. Only present for CONFIRMED / INFERRED fields extracted by the
   *  Requirement Agent — never fabricated for MISSING fields. */
  confidence?: number;
}

export interface RequirementValidation {
  prId: string;
  fields: RequirementValidationField[];
  blockingIssues: string[];
  evaluatedAt: ISODateTime;
}

export type ProcurementTaskPriority = "HIGH" | "MEDIUM" | "READY";

export interface ProcurementTask {
  id: string;
  prId: string;
  prNumber: string;
  materialName: string;
  priority: ProcurementTaskPriority;
  headline: string;
  detail: string;
  actionLabel: string;
  actionHref: string;
}

export interface ProcurementDashboardSummary {
  openPRs: number;
  recommendationsReady: number;
  pendingApprovals: number;
  exceptions: number;
}

export interface ProcurementAiOpportunities {
  estimatedSavings?: Money;
  negotiationCount: number;
  priceAnomalies: number;
  deliveryRisks: number;
  qualityRisks: number;
}

export interface AIStandingBrief {
  paragraphs: string[];
  statusPills: { label: string; tone: "success" | "danger" | "warning" | "ai" }[];
  generatedAt: ISODateTime;
}

export interface ActivityEvent {
  id: string;
  message: string;
  occurredAt: ISODateTime;
  entityHref?: string;
}

/** Data contract for GET /dashboard (Command Center). */
export interface ProcurementDashboardData {
  summary: ProcurementDashboardSummary;
  decisionQueue: ProcurementTask[];
  aiOpportunities: ProcurementAiOpportunities;
  recentActivity: ActivityEvent[];
  standingBrief: AIStandingBrief;
}

/** Live counts shown as badges in the sidebar nav — computed from the
 *  same underlying data the Command Center summarizes, so the two never
 *  disagree with each other. */
export interface NavCounts {
  prQueue: number;
  awaitingSupplier: number;
  awaitingDecision: number;
  exceptions: number;
  supplierInbox: number;
}

export interface SourcingState {
  eligibleSupplierCount: number;
  contactedSupplierCount: number;
  respondedSupplierCount: number;
  comparableHistoricalPurchases: number;
}

export interface SupplierSummaryHighlight {
  label: "BEST_PRICE" | "BEST_DELIVERY" | "BEST_OVERALL";
  supplierId: string;
  supplierName: string;
  value: string;
}

export interface SupplierSummary {
  highlights: SupplierSummaryHighlight[];
}

export interface WorkflowStep {
  key: PRStatus;
  label: string;
  completed: boolean;
  current: boolean;
}

export interface WorkflowState {
  steps: WorkflowStep[];
}

/** Data contract for GET /requisitions/[prNumber] (PR Overview). */
export interface PRDetailData {
  requisition: PurchaseRequisition;
  requirementValidation: RequirementValidation;
  sourcingState: SourcingState;
  supplierSummary: SupplierSummary;
  workflowState: WorkflowState;
}

export interface PRTimelineEntry {
  id: string;
  label: string;
  description?: string;
  actor?: Actor;
  occurredAt: ISODateTime;
  riskFlag?: RiskLevel;
  evidence?: EvidenceReference[];
}

export interface PRTimelineData {
  prId: string;
  entries: PRTimelineEntry[];
}
