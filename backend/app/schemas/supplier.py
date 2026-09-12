from datetime import date, datetime
from typing import Literal

from app.schemas.common import CamelModel, Money, RiskLevel

SupplierApprovalStatus = Literal["APPROVED", "PENDING_APPROVAL", "SUSPENDED"]
PerformanceTrend = Literal["IMPROVING", "STABLE", "DECLINING"]


class SupplierScoreBreakdown(CamelModel):
    """Always the deterministic truth-engine's output (Phase 4) — never an
    LLM's — mirrors frontend/types/supplier.ts and
    docs/architecture/decisions/supplier-score.md exactly."""

    overall: float
    price: float
    quality: float
    delivery: float
    commercial: float
    config_version: str


class SupplierPerformanceMetrics(CamelModel):
    on_time_delivery_rate: float
    quality_acceptance_rate: float
    response_rate: float
    average_unit_price: Money | None = None
    total_purchases: int
    sample_size_units: int | None = None
    sample_size_transactions: int
    measured_at: datetime


class Supplier(CamelModel):
    id: str
    code: str
    name: str
    approval_status: SupplierApprovalStatus
    risk_level: RiskLevel
    categories: list[str]
    performance: SupplierPerformanceMetrics | None = None
    score_breakdown: SupplierScoreBreakdown | None = None


class SupplierPerformanceTrends(CamelModel):
    price: PerformanceTrend
    delivery: PerformanceTrend
    quality: PerformanceTrend


class SupplierPricePoint(CamelModel):
    date: date
    unit_price: Money
    po_reference: str


class SupplierTransaction(CamelModel):
    id: str
    po_reference: str
    material_name: str
    unit_price: Money
    delivered_on_time: bool
    quality_accepted: bool
    occurred_at: date


class SupplierDetailData(CamelModel):
    """Data contract for GET /suppliers/{slug} — matches
    frontend/types/supplier.ts `SupplierDetailData` field-for-field."""

    supplier: Supplier
    performance: SupplierPerformanceMetrics
    score_breakdown: SupplierScoreBreakdown
    trends: SupplierPerformanceTrends
    price_history: list[SupplierPricePoint]
    recent_transactions: list[SupplierTransaction]


class SupplierShortlistCandidate(CamelModel):
    supplier: Supplier
    rank: int
    ai_score: float
    quoted_unit_price: Money | None = None
    historical_median_price: Money | None = None
    reasons: list[str]
