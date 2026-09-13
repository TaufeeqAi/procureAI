from dataclasses import dataclass


@dataclass(frozen=True)
class GoldenCase:
    pr_number: str
    expected_supplier_id: str
    expected_unit_price_inr: float
    evidence_required: tuple[str, ...]


HERO_CASE = GoldenCase(
    pr_number="PR-2026-00983",
    expected_supplier_id="sup-001",
    expected_unit_price_inr=1180.0,
    evidence_required=(
        "ev-PR-2026-00983-sup-001-quote",
        "ev-PR-2026-00983-sup-001-benchmark",
        "ev-PR-2026-00983-sup-001-quality",
        "ev-PR-2026-00983-sup-001-otd",
    ),
)

