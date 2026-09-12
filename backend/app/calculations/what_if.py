"""Deterministic what-if procurement scoring."""

from dataclasses import dataclass
from datetime import date

from app.calculations.supplier_score import SUPPLIER_SCORE_CONFIG, SupplierScoreInput, compute_supplier_score


@dataclass(frozen=True, slots=True)
class WhatIfWeights:
    price: float
    quality: float
    delivery: float
    commercial: float
    risk: float

    def normalized(self) -> "WhatIfWeights":
        values = (self.price, self.quality, self.delivery, self.commercial, self.risk)
        if any(value < 0 for value in values):
            raise ValueError("what-if weights cannot be negative")
        total = sum(values)
        if total <= 0:
            raise ValueError("what-if weights must sum to a positive value")
        return WhatIfWeights(*(round(value / total, 8) for value in values))


@dataclass(frozen=True, slots=True)
class WhatIfSupplierInput:
    supplier_id: str
    supplier_name: str
    unit_price: float
    freight: float
    tax_rate_percent: float
    payment_terms_days: int
    lead_time_days: int
    on_time_delivery_rate: float | None
    quality_acceptance_rate: float | None
    supplier_risk_score: float
    supplier_risk_level: str


@dataclass(frozen=True, slots=True)
class WhatIfSupplierResult:
    supplier_id: str
    supplier_name: str
    baseline_score: float
    scenario_score: float
    baseline_landed_cost: float
    scenario_landed_cost: float
    feasible: bool
    warning: str | None


def weighted_score(
    supplier: WhatIfSupplierInput,
    *,
    lowest_price: float,
    target_payment_days: int,
    weights: WhatIfWeights,
) -> float:
    price = (lowest_price / supplier.unit_price) * 100.0 if supplier.unit_price > 0 else 0.0
    quality = (supplier.quality_acceptance_rate or 0.0) * 100.0
    delivery = (supplier.on_time_delivery_rate or 0.0) * 100.0
    commercial = (min(100.0, (supplier.payment_terms_days / target_payment_days) * 100.0)
                  if target_payment_days > 0 else 0.0)
    scenario = (
        price * weights.price
        + quality * weights.quality
        + delivery * weights.delivery
        + commercial * weights.commercial
        + supplier.supplier_risk_score * weights.risk
    )
    return round(max(0.0, min(100.0, scenario)), 4)


def landed_cost(quantity: int, unit_price: float, freight: float, tax_rate_percent: float) -> float:
    if quantity <= 0:
        raise ValueError("quantity must be greater than zero")
    taxable = quantity * unit_price + freight
    return round(taxable + taxable * (tax_rate_percent / 100.0), 2)


def run_what_if(
    *,
    quantity: int,
    required_date: date,
    baseline_date: date,
    suppliers: list[WhatIfSupplierInput],
    weights: WhatIfWeights,
) -> list[WhatIfSupplierResult]:
    if quantity <= 0:
        raise ValueError("quantity must be greater than zero")
    normalized = weights.normalized()
    lowest_price = min((s.unit_price for s in suppliers if s.unit_price > 0), default=0.0)
    results: list[WhatIfSupplierResult] = []
    target_payment_days = 45

    for supplier in suppliers:
        baseline = weighted_score(
            supplier,
            lowest_price=lowest_price,
            target_payment_days=target_payment_days,
            weights=WhatIfWeights(**SUPPLIER_SCORE_CONFIG["weights"], risk=0.0),
        )
        scenario = weighted_score(
            supplier,
            lowest_price=lowest_price,
            target_payment_days=target_payment_days,
            weights=normalized,
        )
        baseline_cost = landed_cost(quantity, supplier.unit_price, supplier.freight, supplier.tax_rate_percent)
        scenario_cost = landed_cost(quantity, supplier.unit_price, supplier.freight, supplier.tax_rate_percent)
        expected_delivery = baseline_date.toordinal() + supplier.lead_time_days
        required_ordinal = required_date.toordinal()
        feasible = expected_delivery <= required_ordinal
        warning = None
        if not feasible:
            warning = f"Lead time misses the required date by {expected_delivery - required_ordinal} day(s)."
        results.append(
            WhatIfSupplierResult(
                supplier_id=supplier.supplier_id,
                supplier_name=supplier.supplier_name,
                baseline_score=round(baseline, 2),
                scenario_score=round(scenario, 2),
                baseline_landed_cost=baseline_cost,
                scenario_landed_cost=scenario_cost,
                feasible=feasible,
                warning=warning,
            )
        )
    return sorted(results, key=lambda result: (-result.scenario_score, result.supplier_id))
