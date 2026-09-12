from app.calculations.pricing import compute_landed_cost


def test_hero_scenario_abc_matches_frontend():
    """The exact ABC Precision numbers from the hero PR (PR-2026-00983),
    verified independently in this project's history and reproduced here
    so backend and frontend can never silently drift on this scenario."""
    result = compute_landed_cost(quantity=200, unit_price=1180, freight=3000, tax_rate_percent=18)
    assert result.subtotal.amount == 236000
    assert result.tax_amount.amount == 43020
    assert result.total.amount == 282020


def test_hero_scenario_xyz_matches_frontend():
    result = compute_landed_cost(quantity=200, unit_price=1150, freight=4500, tax_rate_percent=18)
    assert result.total.amount == 276710


def test_hero_scenario_pqr_matches_frontend():
    result = compute_landed_cost(quantity=200, unit_price=1110, freight=2500, tax_rate_percent=18)
    assert result.total.amount == 264910


def test_half_boundary_rounds_like_javascript_math_round():
    """The regression test _round_half_up exists for: 100 * 12.5% = 12.5
    exactly. Python's builtin round(12.5) gives 12 (banker's rounding);
    JavaScript's Math.round(12.5) — what the frontend actually runs —
    gives 13. This asserts the backend matches the frontend, not Python's
    default rounding behavior."""
    result = compute_landed_cost(quantity=1, unit_price=100, freight=0, tax_rate_percent=12.5)
    assert result.tax_amount.amount == 13, (
        "Tax amount must round half AWAY FROM ZERO to match the frontend's "
        "Math.round, not Python's banker's-rounding round()"
    )


def test_currency_propagates_to_every_money_field():
    result = compute_landed_cost(quantity=10, unit_price=50, freight=5, tax_rate_percent=10, currency="USD")
    assert result.subtotal.currency == "USD"
    assert result.freight.currency == "USD"
    assert result.tax_amount.currency == "USD"
    assert result.total.currency == "USD"
