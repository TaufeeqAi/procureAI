from datetime import date, datetime
from typing import Literal

from app.schemas.common import CamelModel, Money, RiskLevel

QuoteValidationStatus = Literal["VALID", "NEEDS_REVIEW", "INVALID"]


class ExtractedQuoteField(CamelModel):
    field: str
    label: str
    value: str
    confidence: float


class QuoteFieldConflictCandidate(CamelModel):
    value: str
    source_location: str


class QuoteFieldConflict(CamelModel):
    field: str
    label: str
    candidate_values: list[QuoteFieldConflictCandidate]


class Quote(CamelModel):
    id: str
    quote_reference: str
    pr_id: str
    supplier_id: str
    supplier_name: str
    source_document_name: str
    unit_price: Money
    quantity: int
    freight: Money
    tax_rate_percent: float
    lead_time_days: int
    payment_terms_days: int
    validity_days: int
    extracted_fields: list[ExtractedQuoteField]
    conflicts: list[QuoteFieldConflict]
    validation_status: QuoteValidationStatus
    received_at: datetime


class LandedCostBreakdown(CamelModel):
    """Always computed by app/calculations/pricing.py — never a value
    read straight off a database column — mirroring how the frontend's
    lib/utils/pricing.ts is the one place this formula exists there too.
    See app/models/quote.py for why this is never persisted on a Quote."""

    subtotal: Money
    freight: Money
    tax_amount: Money
    tax_rate_percent: float
    total: Money


class QuoteComparisonRow(CamelModel):
    quote: Quote
    landed_cost: LandedCostBreakdown
    quality_acceptance_rate: float
    on_time_delivery_rate: float
    risk_level: RiskLevel
    deterministic_score: float
    score_config_version: str
    risk_score: float


class QuoteComparisonData(CamelModel):
    pr_id: str
    rows: list[QuoteComparisonRow]
    ai_interpretation: str | None = None
    generated_at: datetime


class HistoricalPricePoint(CamelModel):
    date: date
    unit_price: Money

