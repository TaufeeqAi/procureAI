from datetime import datetime
from typing import Literal

from app.schemas.common import CamelModel, ConfidenceBand, EvidenceReference, Money, RiskLevel

AgentKind = Literal[
    "REQUIREMENT_AGENT", "SUPPLIER_INTELLIGENCE_AGENT", "COMMUNICATION_AGENT",
    "QUOTE_INTELLIGENCE_AGENT", "PROCUREMENT_ANALYST", "RISK_AGENT", "NEGOTIATION_AGENT",
]
AgentRunStatus = Literal[
    "QUEUED", "RUNNING", "ANALYZING", "WAITING_FOR_EXTERNAL_EVENT",
    "WAITING_FOR_REVIEW", "COMPLETED", "FAILED",
]
RecommendationState = Literal["READY", "REVIEW_REQUIRED", "INSUFFICIENT_DATA"]


class AgentRun(CamelModel):
    """Mirrors frontend/types/ai.ts `AgentRun` — the same shape
    `lib/mock/agent-pipeline.ts`'s `runMockAgentPipeline` produces on the
    frontend today. Phase 5 is what makes this schema describe a *real*
    LangGraph run instead of a seeded row; the shape itself doesn't
    change, per docs/architecture/ai-interaction-layer.md."""

    id: str
    agent: AgentKind
    label: str
    status: AgentRunStatus
    pr_id: str
    summary: str | None = None
    output_href: str | None = None
    started_at: datetime
    completed_at: datetime | None = None


class ScoreDimension(CamelModel):
    value: float
    label: str
    detail: str | None = None


class RiskFlag(CamelModel):
    severity: RiskLevel
    message: str
    evidence: list[EvidenceReference] | None = None


class PolicyCheck(CamelModel):
    label: str
    passed: bool
    detail: str | None = None


class RecommendationDimensions(CamelModel):
    price: ScoreDimension
    quality: ScoreDimension
    delivery: ScoreDimension
    commercial_terms: ScoreDimension
    risk: ScoreDimension


class RecommendationAlternative(CamelModel):
    supplier_id: str
    supplier_name: str
    overall_score: float
    noteworthy_difference: str


class ProcurementRecommendation(CamelModel):
    """
    The central AI output of the product — mirrors
    frontend/types/ai.ts `ProcurementRecommendation` field-for-field.
    `confidence` and `overall_score` are always the deterministic
    truth-engine's numbers (Phase 4); `reasons` and `trade_off` are the
    AI's explanation of those numbers, never a replacement for them. See
    docs/architecture/decisions/supplier-score.md and
    confidence-thresholds.md — the latter is still explicitly open, and
    this schema does not resolve it; it just carries whatever value the
    service layer computes today.
    """

    id: str
    pr_id: str
    supplier_id: str
    supplier_name: str
    confidence: float
    confidence_band: ConfidenceBand
    recommendation_state: RecommendationState
    overall_score: float
    dimensions: RecommendationDimensions
    reasons: list[str]
    trade_off: str | None = None
    risks: list[RiskFlag]
    evidence: list[EvidenceReference]
    policy_checks: list[PolicyCheck]
    alternatives: list[RecommendationAlternative]
    generated_at: datetime


class WhatIfWeights(CamelModel):
    price: float
    quality: float
    delivery: float
    commercial: float
    risk: float


class WhatIfScenarioInput(CamelModel):
    required_date: str | None = None
    quantity: int | None = None
    weights: WhatIfWeights


class WhatIfSupplierResult(CamelModel):
    supplier_id: str
    supplier_name: str
    baseline_score: float
    scenario_score: float
    feasible: bool
    warning: str | None = None


class WhatIfResult(CamelModel):
    pr_id: str
    scenario: WhatIfScenarioInput
    results: list[WhatIfSupplierResult]
    ai_interpretation: str | None = None


class NegotiationTargetRange(CamelModel):
    low: Money
    high: Money
    benchmark: Money
    variance_percent: float


class NegotiationDraft(CamelModel):
    id: str
    pr_id: str
    supplier_id: str
    target_range: NegotiationTargetRange
    draft_message: str
    status: Literal["DRAFT", "SENT_FOR_APPROVAL", "APPROVED", "SENT"]
    generated_at: datetime


class AIAskExchange(CamelModel):
    id: str
    question: str
    answer: str
    evidence_href: str | None = None
    answered_at: datetime
