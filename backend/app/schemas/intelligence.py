from datetime import date, datetime
from typing import Literal

from pydantic import Field

from app.schemas.common import CamelModel, Money, RiskLevel


class PriceBenchmark(CamelModel):
    material_name: str
    benchmark: Money | None
    sample_size: int
    min_price: Money | None
    max_price: Money | None
    as_of: datetime


class DeterministicRiskFinding(CamelModel):
    code: str
    severity: RiskLevel
    message: str


class DeterministicRiskAssessment(CamelModel):
    level: RiskLevel
    score: float
    expected_delivery_date: date
    delivery_slack_days: int
    findings: list[DeterministicRiskFinding]


class DeterministicSupplierAssessment(CamelModel):
    supplier_id: str
    supplier_name: str
    quote_reference: str | None
    price_score: float
    quality_score: float
    delivery_score: float
    commercial_score: float
    risk_score: float
    overall_score: float
    score_config_version: str
    risk_level: RiskLevel
    price_variance_percent: float | None
    historical_sample_size: int
    risk_assessment: DeterministicRiskAssessment | None = None


class DeterministicRecommendation(CamelModel):
    supplier_id: str
    supplier_name: str
    overall_score: float
    confidence: float = Field(ge=0, le=1)
    confidence_band: Literal["HIGH", "MEDIUM", "LOW", "INSUFFICIENT_DATA"]
    recommendation_state: Literal["READY", "REVIEW_REQUIRED", "INSUFFICIENT_DATA"]
    rationale: list[str]
    alternatives: list[str]
    score_config_version: str


class ProcurementTruth(CamelModel):
    pr_id: str
    pr_number: str
    material_name: str
    quantity: int
    required_date: date
    benchmark: PriceBenchmark
    suppliers: list[DeterministicSupplierAssessment]
    recommendation: DeterministicRecommendation | None
    generated_at: datetime


class WhatIfWeights(CamelModel):
    price: float = Field(ge=0)
    quality: float = Field(ge=0)
    delivery: float = Field(ge=0)
    commercial: float = Field(ge=0)
    risk: float = Field(ge=0)


class WhatIfScenarioInput(CamelModel):
    required_date: date
    quantity: int = Field(gt=0)
    weights: WhatIfWeights


class WhatIfSupplierResult(CamelModel):
    supplier_id: str
    supplier_name: str
    baseline_score: float
    scenario_score: float
    baseline_landed_cost: Money
    scenario_landed_cost: Money
    feasible: bool
    warning: str | None = None


class WhatIfResponse(CamelModel):
    pr_id: str
    scenario: WhatIfScenarioInput
    results: list[WhatIfSupplierResult]
    generated_at: datetime
