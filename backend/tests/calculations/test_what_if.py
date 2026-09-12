from app.calculations.what_if import WhatIfWeights


def test_weights_are_normalized():
    weights = WhatIfWeights(3, 2, 1, 0, 0).normalized()
    assert sum((weights.price, weights.quality, weights.delivery, weights.commercial, weights.risk)) == 1
    assert weights.price == 0.5


def test_zero_total_weights_fail():
    import pytest
    with pytest.raises(ValueError):
        WhatIfWeights(0, 0, 0, 0, 0).normalized()
