from datetime import date, datetime

from app.calculations.risk import assess_quote_risk


def test_overdue_delivery_is_high_risk():
    result = assess_quote_risk(
        received_at=datetime.fromisoformat("2026-09-04T09:00:00+05:30"),
        required_date=date(2026, 9, 25),
        lead_time_days=31,
        supplier_risk_level="LOW",
        on_time_delivery_rate=0.96,
        quality_acceptance_rate=0.98,
        quote_valid=True,
    )
    assert result.level == "HIGH"
    assert result.delivery_slack_days < 0
    assert any(f.code == "DELIVERY_MISS" for f in result.findings)


def test_low_buffer_is_flagged_but_can_remain_medium():
    result = assess_quote_risk(
        received_at=datetime.fromisoformat("2026-09-04T09:00:00+05:30"),
        required_date=date(2026, 9, 25),
        lead_time_days=19,
        supplier_risk_level="LOW",
        on_time_delivery_rate=0.96,
        quality_acceptance_rate=0.98,
        quote_valid=True,
    )
    assert result.level == "MEDIUM"
    assert result.delivery_slack_days == 2
