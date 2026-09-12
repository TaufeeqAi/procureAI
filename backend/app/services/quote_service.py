from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.calculations.pricing import compute_landed_cost
from app.calculations.risk import assess_quote_risk
from app.calculations.supplier_score import (
    SupplierScoreInput,
    compute_supplier_score,
    score_commercial,
    score_from_relative_price,
    score_quality,
    score_delivery,
)
from app.core.exceptions import NotFoundError
from app.models.quote import Quote as QuoteModel
from app.models.requisition import Requisition
from app.schemas.common import Money
from app.schemas.quote import (
    ExtractedQuoteField,
    Quote,
    QuoteComparisonData,
    QuoteComparisonRow,
    QuoteFieldConflict,
)

TARGET_PAYMENT_DAYS = 45


def to_schema(q: QuoteModel, pr_number: str) -> Quote:
    return Quote(
        id=q.id,
        quote_reference=q.quote_reference,
        pr_id=q.requisition_id,
        pr_number=pr_number,
        supplier_id=q.supplier_id,
        supplier_name=q.supplier.name,
        source_document_name=q.source_document_name,
        unit_price=Money(currency=q.unit_price_currency, amount=q.unit_price_amount),
        quantity=q.quantity,
        freight=Money(currency=q.freight_currency, amount=q.freight_amount),
        tax_rate_percent=q.tax_rate_percent,
        lead_time_days=q.lead_time_days,
        payment_terms_days=q.payment_terms_days,
        validity_days=q.validity_days,
        extracted_fields=[ExtractedQuoteField.model_validate(f) for f in q.extracted_fields],
        conflicts=[QuoteFieldConflict.model_validate(f) for f in q.conflicts],
        validation_status=q.validation_status,
        received_at=q.received_at,
    )


async def list_quotes(db: AsyncSession) -> list[Quote]:
    result = await db.execute(select(QuoteModel).options(selectinload(QuoteModel.supplier), selectinload(QuoteModel.requisition)))
    return [to_schema(q, q.requisition.pr_number) for q in result.scalars().all()]


async def get_quote_detail(db: AsyncSession, quote_reference: str) -> Quote:
    result = await db.execute(
        select(QuoteModel)
        .where(QuoteModel.quote_reference == quote_reference)
        .options(selectinload(QuoteModel.supplier), selectinload(QuoteModel.requisition))
    )
    quote = result.scalar_one_or_none()
    if quote is None:
        raise NotFoundError(f"Quote {quote_reference} not found", code="quote_not_found")
    return to_schema(quote, quote.requisition.pr_number)


async def get_quote_comparison(db: AsyncSession, pr_number: str) -> QuoteComparisonData | None:
    pr_result = await db.execute(select(Requisition).where(Requisition.pr_number == pr_number))
    pr = pr_result.scalar_one_or_none()
    if pr is None:
        raise NotFoundError(f"Requisition {pr_number} not found", code="requisition_not_found")

    quote_result = await db.execute(
        select(QuoteModel).where(QuoteModel.requisition_id == pr.id).options(selectinload(QuoteModel.supplier))
    )
    quotes = quote_result.scalars().all()
    if not quotes:
        return None

    lowest_price = min(q.unit_price_amount for q in quotes if q.unit_price_amount > 0)
    rows: list[QuoteComparisonRow] = []
    for q in quotes:
        supplier = q.supplier
        risk = assess_quote_risk(
            received_at=q.received_at,
            required_date=pr.required_date,
            lead_time_days=q.lead_time_days,
            supplier_risk_level=supplier.risk_level.value if hasattr(supplier.risk_level, "value") else supplier.risk_level,
            on_time_delivery_rate=supplier.on_time_delivery_rate,
            quality_acceptance_rate=supplier.quality_acceptance_rate,
            quote_valid=q.validation_status.value == "VALID" if hasattr(q.validation_status, "value") else q.validation_status == "VALID",
        )
        score = compute_supplier_score(
            SupplierScoreInput(
                price_score=score_from_relative_price(q.unit_price_amount, lowest_price),
                quality_score=score_quality(supplier.quality_acceptance_rate),
                delivery_score=score_delivery(supplier.on_time_delivery_rate),
                commercial_score=score_commercial(q.payment_terms_days, TARGET_PAYMENT_DAYS),
            )
        )
        rows.append(
            QuoteComparisonRow(
                quote=to_schema(q, pr_number),
                landed_cost=compute_landed_cost(q.quantity, q.unit_price_amount, q.freight_amount, q.tax_rate_percent),
                quality_acceptance_rate=supplier.quality_acceptance_rate or 0,
                on_time_delivery_rate=supplier.on_time_delivery_rate or 0,
                risk_level=risk.level,
                deterministic_score=score.overall,
                score_config_version=score.config_version,
                risk_score=risk.score,
            )
        )

    rows.sort(key=lambda row: (-row.deterministic_score, row.quote.supplier_name))
    return QuoteComparisonData(pr_id=pr.id, rows=rows, ai_interpretation=None, generated_at=datetime.now(UTC))
