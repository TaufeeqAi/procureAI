import math

from app.schemas.common import CurrencyCode
from app.schemas.quote import LandedCostBreakdown, Money


def _round_half_up(value: float) -> int:
    """
    Matches JavaScript's `Math.round` semantics — round half AWAY FROM
    ZERO — not Python's built-in `round()`, which uses banker's rounding
    (round-half-to-even).

    This is not a style preference: `round(12.5)` is `12` in Python but
    `13` in JavaScript, and the frontend's `lib/utils/pricing.ts` (the
    formula this function ports) is compiled to run `Math.round` in the
    browser. Without this fix, a tax amount landing exactly on a .5
    boundary would silently disagree between frontend and backend by one
    paisa — the exact class of GST-total bug already caught once earlier
    in this project's history, this time at the cross-language boundary
    instead of within one codebase. See tests/calculations/test_pricing.py
    for the regression test this specifically guards against.
    """
    return math.floor(value + 0.5)


def compute_landed_cost(
    quantity: int,
    unit_price: float,
    freight: float,
    tax_rate_percent: float,
    currency: CurrencyCode = "INR",
) -> LandedCostBreakdown:
    """
    The one place landed cost is computed anywhere in this backend —
    ports `lib/utils/pricing.ts::computeLandedCost` on the frontend
    exactly, including its rounding behavior (see `_round_half_up`
    above). Every service function that returns a quote comparison or a
    purchase order cost breakdown calls this; none of them re-derive the
    arithmetic inline.
    """
    subtotal_amount = quantity * unit_price
    taxable_amount = subtotal_amount + freight
    tax_amount = _round_half_up(taxable_amount * (tax_rate_percent / 100))
    total_amount = taxable_amount + tax_amount

    def money(amount: float) -> Money:
        return Money(currency=currency, amount=amount)

    return LandedCostBreakdown(
        subtotal=money(subtotal_amount),
        freight=money(freight),
        tax_amount=money(tax_amount),
        tax_rate_percent=tax_rate_percent,
        total=money(total_amount),
    )

