import type {
  AIConfidence,
  ConfidenceBand,
  EvidenceItem,
  EvidenceReference,
  ISODateTime,
  RiskLevel,
  Severity,
} from "./common";
import type { SupplierScoreBreakdown } from "./supplier";

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
  startedAt: string;
  completedAt?: string;
}

export interface ScoreDimension {
  /** 0–1. Always produced by the deterministic truth engine, never by the LLM. */
  value: number;
  label: string;
  detail?: string;
}

export interface RecommendationDimensions {
  price: ScoreDimension;
  quality: ScoreDimension;
  delivery: ScoreDimension;
  commercialTerms: ScoreDimension;
  risk: ScoreDimension;
}

export interface RiskFlag {
  id?: string;
  severity: RiskLevel;
  message: string;
  relatedEntity?: string;
  evidence?: EvidenceReference[];
}

export interface PolicyCheck {
  label: string;
  passed: boolean;
  detail?: string;
}

export type RecommendationState = "READY" | "REVIEW_REQUIRED" | "INSUFFICIENT_DATA";

export interface RecommendationAlternative {
  supplierId: string;
  supplierName: string;
  overallScore: number;
  noteworthyDifference: string;
}

export interface ProcurementRecommendation {
  id: string;
  prId: string;
  prNumber?: string; // Kept for backward compatibility
  supplierId: string;
  supplierName: string;
  confidence: number;
  confidenceBand: ConfidenceBand;
  recommendationState: RecommendationState;
  overallScore: number;
  dimensions: RecommendationDimensions;
  reasons: string[];
  tradeOff?: string;
  risks: RiskFlag[];
  evidence: EvidenceReference[];
  policyChecks: PolicyCheck[];
  alternatives: RecommendationAlternative[];
  generatedAt: ISODateTime;
}

export interface NegotiationTargetRange {
  low: { currency: string; amount: number };
  high: { currency: string; amount: number };
  benchmark: { currency: string; amount: number };
  variancePercent: number;
}

export interface NegotiationDraft {
  id: string;
  prId: string;
  prNumber?: string;
  supplierId: string;
  targetRange: NegotiationTargetRange;
  draftMessage: string;
  status: "DRAFT" | "SENT_FOR_APPROVAL" | "APPROVED" | "SENT";
  generatedAt: ISODateTime;
}

export interface AIGeneratedNegotiationDraft {
  supplierId: string;
  targetUnitPriceInr: number;
  anchorReason: string;
  messageBody: string;
  evidenceIds: string[];
}

export type WhatIfWeightKey = "price" | "quality" | "delivery" | "commercial" | "risk";
export interface WhatIfWeights extends Record<WhatIfWeightKey, number> {}

export interface WhatIfScenarioResult {
  supplierId: string;
  originalScore: number;
  newScore: number;
  delta: number;
}

export interface WhatIfResult {
  prId: string;
  scenario: { requiredDate: string; quantity: number; weights: WhatIfWeights };
  results: Array<{
    supplierId: string;
    supplierName: string;
    baselineScore: number;
    scenarioScore: number;
    feasible: boolean;
    warning?: string;
  }>;
  aiInterpretation?: string;
}

export type AIAgentName =
  | "requirement_agent"
  | "supplier_agent"
  | "quote_agent"
  | "procurement_analyst"
  | "risk_agent"
  | "negotiation_agent"
  | "question_agent"
  | "human_decision"
  | "graph";

export type AIActivityStatus = "complete" | "in_progress" | "pending" | "failed" | "started";

export interface AIActivityEntry {
  id: string;
  prNumber?: string;
  agent: AIAgentName;
  label: string;
  detail: string;
  status: AIActivityStatus;
  severity?: Severity;
  timestamp: string;
}

export type ProcurementAIRunStatus = "completed" | "failed";

export interface ProcurementAIRun {
  runId: string;
  threadId: string;
  prNumber: string;
  status: ProcurementAIRunStatus;
  graphVersion: string;
  promptVersion: string;
  model: string;
  recommendation: ProcurementRecommendation;
  negotiation?: AIGeneratedNegotiationDraft | null;
  activity: Array<{
    agent: AIAgentName;
    label: string;
    status: "started" | "complete" | "failed";
    detail: string;
    timestamp: string;
  }>;
  errors: Array<Record<string, unknown>>;
}

// --- Phase 6 SSE & Q&A Contracts ---

export type AIStreamEventType = "run.started" | "activity" | "run.completed" | "run.failed" | "heartbeat";

export interface AIStreamEnvelope {
  type: AIStreamEventType;
  runId: string;
  prNumber: string;
  threadId: string;
  sequence: number;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface AIQuestionExchange {
  id: string;
  threadId: string;
  prNumber: string;
  question: string;
  answer: string;
  uncertainty?: string;
  evidence: EvidenceReference[];
  graphVersion: string;
  promptVersion: string;
  model: string;
  answeredAt: string;
}

export interface AIQuestionRequest {
  question: string;
  threadId?: string;
}

// --- Preserved Phase 3/4 Contracts ---

export interface AIAskQuestion {
  id: string;
  label: string;
}

export interface AIAskExchange {
  id: string;
  question: string;
  answer: string;
  evidenceHref?: string;
  answeredAt: string;
}