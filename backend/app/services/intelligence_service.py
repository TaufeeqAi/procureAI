"""Application orchestration for Phase 4 deterministic intelligence.

This module performs database reads and delegates every calculation to the
pure functions in ``app.calculations``. No LLM call is allowed here.
"""

from datetime import UTC, date, datetime
from statistics import median

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.calculations.benchmarking import compute_price_benchmark, normalize_material_name, price_variance_percent
from app.calculations.risk import assess_quote_risk
from app.calculations.supplier_score import (
    SUPPLIER_SCORE_CONFIG,
    SupplierScoreInput,
    compute_supplier_score,
    score_commercial,
    score_from_benchmark,
    score_from_relative_price,
    score_quality,
    score_delivery,
)
from app.calculations.what_if import WhatIfSupplierInput as CalculationWhatIfSupplierInput
from app.calculations.what_if import WhatIfWeights as CalculationWhatIfWeights
from app.calculations.what_if import run_what_if
from app.core.exceptions import NotFoundError
from app.models.quote import Quote
from app.models.requisition import Requisition
from app.models.supplier import Supplier, SupplierTransactionRecord
from app.schemas.common import Money
from app.schemas.intelligence import (
    DeterministicRecommendation,
    DeterministicRiskAssessment,
    DeterministicRiskFinding,
    DeterministicSupplierAssessment,
    PriceBenchmark,
    ProcurementTruth,
    WhatIfResponse,
    WhatIfScenarioInput,
    WhatIfSupplierResult,
)

TARGET_PAYMENT_DAYS = 45
CONFIDENCE_HIGH = 0.80
CONFIDENCE_MEDIUM = 0.55
MINIMUM_DATA_SAMPLE = 3


def _money(amount: float | None, currency: str = "INR") -> Money | None:
    return Money(currency=currency, amount=amount) if amount is not None else None


def _confidence(sample_size: int, score_margin: float) -> tuple[float, str, str]:
    """Map evidence volume + ranking separation to confidence.

    Phase 4 owns a deterministic, configurable confidence proxy. It is not an
    LLM confidence score. Product policy can revise these thresholds later
    without changing the scoring functions themselves.
    """
    if sample_size < MINIMUM_DATA_SAMPLE:
        return 0.0, "INSUFFICIENT_DATA", "INSUFFICIENT_DATA"
    sample_factor = min(sample_size / 20.0, 1.0)
    margin_factor = min(max(score_margin, 0.0) / 10.0, 1.0)
    confidence = round((sample_factor * 0.6) + (margin_factor * 0.4), 4)
    if confidence >= CONFIDENCE_HIGH:
        return confidence, "HIGH", "READY"
    if confidence >= CONFIDENCE_MEDIUM:
        return confidence, "MEDIUM", "REVIEW_REQUIRED"
    return confidence, "LOW", "REVIEW_REQUIRED"


async def _load_pr(db: AsyncSession, pr_number: str) -> Requisition:
    result = await db.execute(select(Requisition).where(Requisition.pr_number == pr_number))
    pr = result.scalar_one_or_none()
    if pr is None:
        raise NotFoundError(f"Requisition {pr_number} not found", code="requisition_not_found")
    return pr


async def _historical_prices(db: AsyncSession, material_name: str) -> list[float]:
    normalized = normalize_material_name(material_name)
    rows = (await db.execute(select(SupplierTransactionRecord))).scalars().all()
    return [row.unit_price_amount for row in rows if normalize_material_name(row.material_name) == normalized]


async def build_procurement_truth(db: AsyncSession, pr_number: str) -> ProcurementTruth:
    pr = await _load_pr(db, pr_number)
    quotes = (
        await db.execute(
            select(Quote).where(Quote.requisition_id == pr.id).options(selectinload(Quote.supplier))
        )
    ).scalars().all()

    historical_prices = await _historical_prices(db, pr.material_name)
    benchmark_calc = compute_price_benchmark(historical_prices)
    benchmark = PriceBenchmark(
        material_name=pr.material_name,
        benchmark=_money(benchmark_calc.value),
        sample_size=benchmark_calc.sample_size,
        min_price=_money(benchmark_calc.min_value),
        max_price=_money(benchmark_calc.max_value),
        as_of=datetime.now(UTC),
    )

    supplier_assessments: list[DeterministicSupplierAssessment] = []
    if quotes:
        lowest_price = min(quote.unit_price_amount for quote in quotes if quote.unit_price_amount > 0)
        for quote in quotes:
            supplier = quote.supplier
            risk = assess_quote_risk(
                received_at=quote.received_at,
                required_date=pr.required_date,
                lead_time_days=quote.lead_time_days,
                supplier_risk_level=supplier.risk_level.value if hasattr(supplier.risk_level, "value") else supplier.risk_level,
                on_time_delivery_rate=supplier.on_time_delivery_rate,
                quality_acceptance_rate=supplier.quality_acceptance_rate,
                quote_valid=quote.validation_status.value == "VALID" if hasattr(quote.validation_status, "value") else quote.validation_status == "VALID",
            )
            score = compute_supplier_score(
                SupplierScoreInput(
                    price_score=score_from_relative_price(quote.unit_price_amount, lowest_price),
                    quality_score=score_quality(supplier.quality_acceptance_rate),
                    delivery_score=score_delivery(supplier.on_time_delivery_rate),
                    commercial_score=score_commercial(quote.payment_terms_days, TARGET_PAYMENT_DAYS),
                )
            )
            supplier_assessments.append(
                DeterministicSupplierAssessment(
                    supplier_id=supplier.id,
                    supplier_name=supplier.name,
                    quote_reference=quote.quote_reference,
                    price_score=score.price,
                    quality_score=score.quality,
                    delivery_score=score.delivery,
                    commercial_score=score.commercial,
                    risk_score=risk.score,
                    overall_score=score.overall,
                    score_config_version=score.config_version,
                    risk_level=risk.level,
                    price_variance_percent=price_variance_percent(quote.unit_price_amount, benchmark_calc.value),
                    historical_sample_size=supplier.sample_size_transactions,
                    risk_assessment=DeterministicRiskAssessment(
                        level=risk.level,
                        score=risk.score,
                        expected_delivery_date=risk.expected_delivery_date,
                        delivery_slack_days=risk.delivery_slack_days,
                        findings=[
                            DeterministicRiskFinding(code=f.code, severity=f.severity, message=f.message)
                            for f in risk.findings
                        ],
                    ),
                )
            )

    supplier_assessments.sort(key=lambda item: (-item.overall_score, item.supplier_id))
    recommendation = None
    if supplier_assessments:
        winner = supplier_assessments[0]
        runner_up = supplier_assessments[1] if len(supplier_assessments) > 1 else None
        margin = winner.overall_score - runner_up.overall_score if runner_up else winner.overall_score
        confidence, band, state = _confidence(winner.historical_sample_size, margin)
        rationale = [
            f"Deterministic score {winner.overall_score:.1f} using {SUPPLIER_SCORE_CONFIG['version']}.",
            f"Price score {winner.price_score:.1f}, quality {winner.quality_score:.1f}, delivery {winner.delivery_score:.1f}, commercial {winner.commercial_score:.1f}.",
        ]
        if winner.price_variance_percent is not None:
            direction = "below" if winner.price_variance_percent < 0 else "above"
            rationale.append(f"Quote is {abs(winner.price_variance_percent):.1f}% {direction} the historical benchmark.")
        if winner.risk_assessment is not None and winner.risk_assessment.delivery_slack_days <= 3:
            rationale.append(f"Delivery buffer is only {winner.risk_assessment.delivery_slack_days} day(s).")
        recommendation = DeterministicRecommendation(
            supplier_id=winner.supplier_id,
            supplier_name=winner.supplier_name,
            overall_score=winner.overall_score,
            confidence=confidence,
            confidence_band=band,
            recommendation_state=state,
            rationale=rationale,
            alternatives=[
                f"{item.supplier_name}: {item.overall_score:.1f} — {item.risk_level} risk"
                for item in supplier_assessments[1:3]
            ],
            score_config_version=winner.score_config_version,
        )

    return ProcurementTruth(
        pr_id=pr.id,
        pr_number=pr.pr_number,
        material_name=pr.material_name,
        quantity=pr.quantity,
        required_date=pr.required_date,
        benchmark=benchmark,
        suppliers=supplier_assessments,
        recommendation=recommendation,
        generated_at=datetime.now(UTC),
    )


async def build_supplier_score(
    db: AsyncSession,
    supplier: Supplier,
    *,
    comparison_prices: list[float] | None = None,
    payment_terms_days: int | None = None,
) -> dict:
    """Compute a profile score without trusting persisted Phase 3 score columns."""
    history_prices = [p.unit_price_amount for p in supplier.price_history]
    benchmark = float(median(history_prices)) if history_prices else supplier.average_unit_price_amount
    price_score = score_from_benchmark(supplier.average_unit_price_amount or benchmark or 0.01, benchmark)
    if comparison_prices:
        price_score = score_from_relative_price(supplier.average_unit_price_amount or max(comparison_prices), min(comparison_prices))
    score = compute_supplier_score(
        SupplierScoreInput(
            price_score=price_score,
            quality_score=score_quality(supplier.quality_acceptance_rate),
            delivery_score=score_delivery(supplier.on_time_delivery_rate),
            commercial_score=score_commercial(payment_terms_days, TARGET_PAYMENT_DAYS),
        )
    )
    return {
        "overall": score.overall,
        "price": score.price,
        "quality": score.quality,
        "delivery": score.delivery,
        "commercial": score.commercial,
        "config_version": score.config_version,
    }


async def build_what_if(
    db: AsyncSession,
    pr_number: str,
    *,
    required_date: date,
    quantity: int,
    weights: CalculationWhatIfWeights,
) -> WhatIfResponse:
    pr = await _load_pr(db, pr_number)
    quotes = (
        await db.execute(select(Quote).where(Quote.requisition_id == pr.id).options(selectinload(Quote.supplier)))
    ).scalars().all()
    if not quotes:
        return WhatIfResponse(
            pr_id=pr.id,
            scenario=WhatIfScenarioInput(
                required_date=required_date,
                quantity=quantity,
                weights={
                    "price": weights.normalized().price,
                    "quality": weights.normalized().quality,
                    "delivery": weights.normalized().delivery,
                    "commercial": weights.normalized().commercial,
                    "risk": weights.normalized().risk,
                },
            ),
            results=[], generated_at=datetime.now(UTC),
        )

    baseline_date = min((quote.received_at.date() for quote in quotes), default=datetime.now(UTC).date())
    inputs = [
        CalculationWhatIfSupplierInput(
            supplier_id=q.supplier.id,
            supplier_name=q.supplier.name,
            unit_price=q.unit_price_amount,
            freight=q.freight_amount,
            tax_rate_percent=q.tax_rate_percent,
            payment_terms_days=q.payment_terms_days,
            lead_time_days=q.lead_time_days,
            on_time_delivery_rate=q.supplier.on_time_delivery_rate,
            quality_acceptance_rate=q.supplier.quality_acceptance_rate,
            supplier_risk_score={"LOW": 100.0, "MEDIUM": 65.0, "HIGH": 30.0}[q.supplier.risk_level.value if hasattr(q.supplier.risk_level, "value") else q.supplier.risk_level],
            supplier_risk_level=q.supplier.risk_level.value if hasattr(q.supplier.risk_level, "value") else q.supplier.risk_level,
        )
        for q in quotes
    ]
    calculated = run_what_if(
        quantity=quantity,
        required_date=required_date,
        baseline_date=baseline_date,
        suppliers=inputs,
        weights=weights,
    )
    normalized = weights.normalized()
    return WhatIfResponse(
        pr_id=pr.id,
        scenario=WhatIfScenarioInput(
            required_date=required_date,
            quantity=quantity,
            weights={
                "price": normalized.price,
                "quality": normalized.quality,
                "delivery": normalized.delivery,
                "commercial": normalized.commercial,
                "risk": normalized.risk,
            },
        ),
        results=[
            WhatIfSupplierResult(
                supplier_id=r.supplier_id,
                supplier_name=r.supplier_name,
                baseline_score=r.baseline_score,
                scenario_score=r.scenario_score,
                baseline_landed_cost=Money(currency="INR", amount=r.baseline_landed_cost),
                scenario_landed_cost=Money(currency="INR", amount=r.scenario_landed_cost),
                feasible=r.feasible,
                warning=r.warning,
            )
            for r in calculated
        ],
        generated_at=datetime.now(UTC),
    )
