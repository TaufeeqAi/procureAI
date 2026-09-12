import pytest

from app.calculations.supplier_score import (
    SupplierScoreInput,
    compute_supplier_score,
    score_commercial,
    score_from_relative_price,
)


def test_relative_price_gives_cheapest_quote_full_score():
    assert score_from_relative_price(100, 100) == 100
    assert score_from_relative_price(120, 100) == pytest.approx(83.3333)


def test_supplier_score_uses_locked_weights():
    result = compute_supplier_score(SupplierScoreInput(100, 80, 60, 40))
    assert result.config_version == "supplier-score.v1"
    assert result.overall == pytest.approx(73.0)


def test_commercial_score_is_capped_at_target():
    assert score_commercial(45, 45) == 100
    assert score_commercial(60, 45) == 100


def test_invalid_price_is_rejected():
    with pytest.raises(ValueError):
        score_from_relative_price(0, 100)
