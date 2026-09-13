import type { AIConfidence, EvidenceItem, RiskLevel, Severity } from "./common";
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

export interface PolicyCheck {
  label: string;
  passed: boolean;
  detail?: string;
}

export type RecommendationState = "READY" | "REVIEW_REQUIRED" | "INSUFFICIENT_DATA";

// --- Phase 5 Updated / New Contracts ---

export interface ProcurementRecommendation {
  prNumber: string;
  supplierId: string;
  confidence: AIConfidence;
  scores: SupplierScoreBreakdown;
  reasons: string[];
  tradeOff?: string;
  risks: RiskFlag[];
  evidence: EvidenceItem[];
  generatedAt: string;
}

export interface RiskFlag {
  id: string;
  severity: RiskLevel;
  message: string;
  relatedEntity?: string;
}

export interface NegotiationTargetRange {
  low: { currency: string; amount: number };
  high: { currency: string; amount: number };
  benchmark: { currency: string; amount: number };
  variancePercent: number;
}

export interface NegotiationDraft {
  prNumber: string;
  supplierId: string;
  currentUnitPriceInr: number;
  benchmarkUnitPriceInr: number;
  targetUnitPriceInr: number;
  messageBody: string;
}

export type WhatIfWeightKey = "price" | "quality" | "delivery" | "commercial" | "risk";
export interface WhatIfWeights extends Record<WhatIfWeightKey, number> {}
export interface WhatIfScenarioResult { 
  supplierId: string; 
  originalScore: number; 
  newScore: number; 
  delta: number; 
}

export type AIAgentName =
  | "requirement_agent"
  | "supplier_agent"
  | "quote_agent"
  | "procurement_analyst"
  | "risk_agent"
  | "negotiation_agent"
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

export interface ProcurementAIRun {
  runId: string;
  threadId: string;
  prNumber: string;
  status: "completed" | "failed";
  graphVersion: string;
  promptVersion: string;
  model: string;
  recommendation: ProcurementRecommendation;
  activity: Array<{
    agent: AIAgentName;
    label: string;
    status: "started" | "complete" | "failed";
    detail: string;
    timestamp: string;
  }>;
  errors: Array<Record<string, unknown>>;
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