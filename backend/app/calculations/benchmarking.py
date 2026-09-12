"""Pure historical price benchmarking helpers.

Database retrieval belongs in the service layer. These functions accept
simple values so benchmark behaviour can be tested independently from SQL.
"""

from dataclasses import dataclass
from statistics import median
from typing import Sequence


@dataclass(frozen=True, slots=True)
class PriceBenchmark:
    value: float | None
    sample_size: int
    min_value: float | None
    max_value: float | None


def normalize_material_name(value: str) -> str:
    return " ".join(value.casefold().split())


def compute_price_benchmark(prices: Sequence[float]) -> PriceBenchmark:
    clean = sorted(value for value in prices if value > 0)
    if not clean:
        return PriceBenchmark(value=None, sample_size=0, min_value=None, max_value=None)
    return PriceBenchmark(
        value=float(median(clean)),
        sample_size=len(clean),
        min_value=float(clean[0]),
        max_value=float(clean[-1]),
    )


def price_variance_percent(current_price: float, benchmark: float | None) -> float | None:
    if current_price <= 0:
        raise ValueError("current price must be greater than zero")
    if benchmark is None or benchmark <= 0:
        return None
    return round(((current_price - benchmark) / benchmark) * 100.0, 4)
