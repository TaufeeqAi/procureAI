import pytest

from app.calculations.benchmarking import compute_price_benchmark, normalize_material_name, price_variance_percent


def test_benchmark_uses_median_not_average():
    result = compute_price_benchmark([100, 120, 500])
    assert result.value == 120
    assert result.sample_size == 3


def test_empty_benchmark_is_explicit():
    result = compute_price_benchmark([])
    assert result.value is None
    assert result.sample_size == 0


def test_material_names_normalize_for_comparison():
    assert normalize_material_name(" Bearing   Housing ") == "bearing housing"


def test_price_variance_is_signed():
    assert price_variance_percent(90, 100) == -10
    assert price_variance_percent(110, 100) == 10


def test_invalid_current_price_is_rejected():
    with pytest.raises(ValueError):
        price_variance_percent(0, 100)
