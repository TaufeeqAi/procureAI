"""Deterministic supplier scoring.

The truth engine is intentionally pure: no database access, no LLM access,
and no wall-clock dependency. Callers supply the already-observed facts and
this module returns a versioned score that can be reproduced in tests,
production, and future AI evaluations.
"""

from dataclasses import dataclass
from typing import Final


SUPPLIER_SCORE_CONFIG: Final[dict] = {
    "version": "supplier-score.v1",
    "weights": {
        "price": 0.30,
        "quality": 0.25,
        "delivery": 0.25,
        "commercial": 0.20,
    },
}


@dataclass(frozen=True, slots=True)
class SupplierScoreInput:
    price_score: float
    quality_score: float
    delivery_score: float
    commercial_score: float


@dataclass(frozen=True, slots=True)
class SupplierScore:
    overall: float
    price: float
    quality: float
    delivery: float
    commercial: float
    config_version: str


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def score_from_relative_price(unit_price: float, lowest_unit_price: float) -> float:
    """Score current quote price relative to the cheapest comparable quote.

    Cheapest receives 100. Higher prices degrade proportionally. This keeps
    price ranking stable across currencies and absolute material values.
    """
    if unit_price <= 0 or lowest_unit_price <= 0:
        raise ValueError("unit prices must be greater than zero")
    return round(_clamp((lowest_unit_price / unit_price) * 100.0), 4)


def score_from_benchmark(unit_price: float, benchmark: float | None) -> float:
    """Score a price against a historical benchmark for supplier profiles.

    A price at or below the benchmark receives 100. Prices above the
    benchmark receive a linear penalty. With no benchmark we return the
    neutral 50 so missing evidence cannot masquerade as a good price.
    """
    if unit_price <= 0:
        raise ValueError("unit price must be greater than zero")
    if benchmark is None or benchmark <= 0:
        return 50.0
    return round(_clamp((benchmark / unit_price) * 100.0), 4)


def score_quality(quality_acceptance_rate: float | None) -> float:
    return round(_clamp((quality_acceptance_rate or 0.0) * 100.0), 4)


def score_delivery(on_time_delivery_rate: float | None) -> float:
    return round(_clamp((on_time_delivery_rate or 0.0) * 100.0), 4)


def score_commercial(payment_terms_days: int | None, target_payment_days: int) -> float:
    """Convert payment terms into a deterministic commercial score.

    Longer terms are better up to the configured target. Missing terms are
    neutral rather than silently treated as optimal.
    """
    if target_payment_days <= 0:
        raise ValueError("target payment days must be greater than zero")
    if payment_terms_days is None:
        return 50.0
    return round(_clamp((payment_terms_days / target_payment_days) * 100.0), 4)


def compute_supplier_score(values: SupplierScoreInput) -> SupplierScore:
    """Return the weighted supplier score using the locked v1 weights."""
    weights = SUPPLIER_SCORE_CONFIG["weights"]
    overall = (
        values.price_score * weights["price"]
        + values.quality_score * weights["quality"]
        + values.delivery_score * weights["delivery"]
        + values.commercial_score * weights["commercial"]
    )
    return SupplierScore(
        overall=round(_clamp(overall), 4),
        price=round(_clamp(values.price_score), 4),
        quality=round(_clamp(values.quality_score), 4),
        delivery=round(_clamp(values.delivery_score), 4),
        commercial=round(_clamp(values.commercial_score), 4),
        config_version=SUPPLIER_SCORE_CONFIG["version"],
    )
