from app.ai.evaluation.golden import HERO_CASE
from app.ai.evaluation.metrics import evidence_grounding_rate, supplier_consistency


def test_hero_case_is_pinned():
    assert HERO_CASE.expected_supplier_id == "sup-001"
    assert HERO_CASE.expected_unit_price_inr == 1180.0


def test_grounding_rate():
    assert evidence_grounding_rate(["a", "b"], {"a", "b", "c"}) == 1.0
    assert evidence_grounding_rate(["a", "x"], {"a", "b", "c"}) == 0.5


def test_supplier_consistency():
    assert supplier_consistency("sup-001", "sup-001") == 1.0
    assert supplier_consistency("sup-002", "sup-001") == 0.0

