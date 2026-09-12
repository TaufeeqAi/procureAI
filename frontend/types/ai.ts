import type { ConfidenceBand, EvidenceReference, ISODateTime, Money, RiskLevel } from "@/types/common";

/**
 * The six-agent AI workforce. Keep this list in sync with
 * backend/app/ai/agents/*.py once Phase 5 introduces the real agents —
 * the frontend's AI Activity screen (Page 18 / /ai) is keyed off these
 * identifiers.
 */
export type AgentKind =
  | "REQUIREMENT_AGENT"
  | "SUPPLIER_INTELLIGENCE_AGENT"
  | "COMMUNICATION_AGENT"
  | "QUOTE_INTELLIGENCE_AGENT"
  | "PROCUREMENT_ANALYST"
  | "RISK_AGENT"
  | "NEGOTIATION_AGENT";

export type AgentRunStatus =
  | "QUEUED"
  | "RUNNING"
  | "ANALYZING"
  | "WAITING_FOR_EXTERNAL_EVENT"
  | "WAITING_FOR_REVIEW"
  | "COMPLETED"
  | "FAILED";

export interface AgentRun {
  id: string;
  agent: AgentKind;
  label: string;
  status: AgentRunStatus;
  prId: string;
  summary?: string;
  outputHref?: string;
  startedAt: ISODateTime;
  completedAt?: ISODateTime;
}

export interface ScoreDimension {
  /** 0–1. Always produced by the deterministic truth engine, never by the LLM. */
  value: number;
  label: string;
  detail?: string;
}

export interface RiskFlag {
  severity: RiskLevel;
  message: string;
  evidence?: EvidenceReference[];
}

export interface PolicyCheck {
  label: string;
  passed: boolean;
  detail?: string;
}

export type RecommendationState = "READY" | "REVIEW_REQUIRED" | "INSUFFICIENT_DATA";

/**
 * The central AI output of the product. Every field here must be
 * traceable to `evidence`, and `confidence` must reflect real sample
 * sizes — see docs/architecture/decisions/confidence-thresholds.md.
 * The frontend's Evidence Panel (components/ai/AIEvidenceDrawer) is the
 * canonical renderer for this contract.
 */
export interface ProcurementRecommendation {
  id: string;
  prId: string;
  supplierId: string;
  supplierName: string;
  /** 0–1 */
  confidence: number;
  confidenceBand: ConfidenceBand;
  recommendationState: RecommendationState;
  overallScore: number;
  dimensions: {
    price: ScoreDimension;
    quality: ScoreDimension;
    delivery: ScoreDimension;
    commercialTerms: ScoreDimension;
    risk: ScoreDimension;
  };
  reasons: string[];
  tradeOff?: string;
  risks: RiskFlag[];
  evidence: EvidenceReference[];
  policyChecks: PolicyCheck[];
  alternatives: {
    supplierId: string;
    supplierName: string;
    overallScore: number;
    noteworthyDifference: string;
  }[];
  generatedAt: ISODateTime;
}

export interface NegotiationTargetRange {
  low: Money;
  high: Money;
  benchmark: Money;
  variancePercent: number;
}

export interface NegotiationDraft {
  id: string;
  prId: string;
  supplierId: string;
  targetRange: NegotiationTargetRange;
  draftMessage: string;
  status: "DRAFT" | "SENT_FOR_APPROVAL" | "APPROVED" | "SENT";
  generatedAt: ISODateTime;
}

export interface AIAskQuestion {
  id: string;
  label: string;
}

export interface AIAskExchange {
  id: string;
  question: string;
  answer: string;
  evidenceHref?: string;
  answeredAt: ISODateTime;
}