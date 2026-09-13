from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class StrictAIModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class RequirementAnalysis(StrictAIModel):
    normalized_requirement: str = Field(min_length=1, max_length=2000)
    critical_constraints: list[str] = Field(default_factory=list, max_length=20)
    missing_information: list[str] = Field(default_factory=list, max_length=20)
    assumptions: list[str] = Field(default_factory=list, max_length=10)
    confidence: float = Field(ge=0, le=1)
    evidence_ids: list[str] = Field(default_factory=list, max_length=20)


class SupplierCandidate(StrictAIModel):
    supplier_id: str
    rank: int = Field(ge=1)
    rationale: str = Field(min_length=1, max_length=1200)


class SupplierAnalysis(StrictAIModel):
    recommended_supplier_id: str
    shortlist: list[SupplierCandidate] = Field(min_length=1, max_length=10)
    trade_off: str | None = Field(default=None, max_length=1200)
    confidence: float = Field(ge=0, le=1)
    evidence_ids: list[str] = Field(default_factory=list, max_length=30)


class QuoteAnalysis(StrictAIModel):
    validated_quote_ids: list[str] = Field(default_factory=list, max_length=20)
    exceptions: list[str] = Field(default_factory=list, max_length=20)
    pricing_observations: list[str] = Field(default_factory=list, max_length=20)
    evidence_ids: list[str] = Field(default_factory=list, max_length=30)


class RiskAnalysis(StrictAIModel):
    overall_risk: Literal["LOW", "MEDIUM", "HIGH"]
    findings: list[str] = Field(default_factory=list, max_length=20)
    mitigations: list[str] = Field(default_factory=list, max_length=20)
    evidence_ids: list[str] = Field(default_factory=list, max_length=30)


class NegotiationDraft(StrictAIModel):
    supplier_id: str
    target_unit_price_inr: float = Field(ge=0)
    anchor_reason: str = Field(min_length=1, max_length=1200)
    message_body: str = Field(min_length=1, max_length=4000)
    evidence_ids: list[str] = Field(default_factory=list, max_length=20)


class FinalAIAnalysis(StrictAIModel):
    supplier_id: str
    decision_summary: str = Field(min_length=1, max_length=1600)
    reasons: list[str] = Field(min_length=1, max_length=10)
    trade_off: str | None = Field(default=None, max_length=1600)
    suggested_actions: list[str] = Field(default_factory=list, max_length=10)
    confidence: float = Field(ge=0, le=1)
    evidence_ids: list[str] = Field(min_length=1, max_length=30)


class AIActivityEvent(StrictAIModel):
    agent: str
    label: str
    status: Literal["started", "complete", "failed"]
    detail: str
    timestamp: str


class ProcurementAIRunOut(StrictAIModel):
    run_id: str
    thread_id: str
    pr_number: str
    status: Literal["completed", "failed"]
    graph_version: str
    prompt_version: str
    model: str
    recommendation: dict
    negotiation: dict | None = None
    activity: list[AIActivityEvent]
    errors: list[dict]