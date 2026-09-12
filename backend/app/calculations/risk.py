"""Deterministic procurement risk rules.

Risk is intentionally explainable and rule-based in Phase 4. The future Risk
Agent can summarize these findings but must not replace their source facts.
"""

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Literal

RiskLevel = Literal["LOW", "MEDIUM", "HIGH"]


@dataclass(frozen=True, slots=True)
class RiskFinding:
    code: str
    severity: RiskLevel
    message: str


@dataclass(frozen=True, slots=True)
class QuoteRiskAssessment:
    level: RiskLevel
    score: float
    expected_delivery_date: date
    delivery_slack_days: int
    findings: tuple[RiskFinding, ...]


def _max_level(*levels: RiskLevel) -> RiskLevel:
    order = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}
    return max(levels, key=order.__getitem__)


def _risk_score(level: RiskLevel) -> float:
    return {"LOW": 100.0, "MEDIUM": 65.0, "HIGH": 30.0}[level]


def assess_quote_risk(
    *,
    received_at: datetime,
    required_date: date,
    lead_time_days: int,
    supplier_risk_level: RiskLevel,
    on_time_delivery_rate: float | None,
    quality_acceptance_rate: float | None,
    quote_valid: bool,
) -> QuoteRiskAssessment:
    if lead_time_days < 0:
        raise ValueError("lead time must be non-negative")
    expected = (received_at.date() + timedelta(days=lead_time_days))
    slack = (required_date - expected).days
    findings: list[RiskFinding] = []
    level: RiskLevel = "LOW"

    if not quote_valid:
        findings.append(RiskFinding("QUOTE_INVALID", "HIGH", "Quote requires review before it can support a commitment."))
        level = _max_level(level, "HIGH")

    if expected > required_date:
        findings.append(
            RiskFinding(
                "DELIVERY_MISS",
                "HIGH",
                f"Expected delivery is {abs(slack)} day(s) after the required date.",
            )
        )
        level = _max_level(level, "HIGH")
    elif slack <= 3:
        findings.append(
            RiskFinding(
                "DELIVERY_BUFFER_LOW",
                "MEDIUM",
                f"Only {slack} day(s) of delivery buffer remain before the required date.",
            )
        )
        level = _max_level(level, "MEDIUM")

    if on_time_delivery_rate is not None:
        if on_time_delivery_rate < 0.80:
            findings.append(RiskFinding("DELIVERY_HISTORY", "HIGH", "Historical on-time delivery is below 80%."))
            level = _max_level(level, "HIGH")
        elif on_time_delivery_rate < 0.90:
            findings.append(RiskFinding("DELIVERY_HISTORY", "MEDIUM", "Historical on-time delivery is below 90%."))
            level = _max_level(level, "MEDIUM")

    if quality_acceptance_rate is not None:
        if quality_acceptance_rate < 0.90:
            findings.append(RiskFinding("QUALITY_HISTORY", "HIGH", "Historical quality acceptance is below 90%."))
            level = _max_level(level, "HIGH")
        elif quality_acceptance_rate < 0.95:
            findings.append(RiskFinding("QUALITY_HISTORY", "MEDIUM", "Historical quality acceptance is below 95%."))
            level = _max_level(level, "MEDIUM")

    level = _max_level(level, supplier_risk_level)
    if supplier_risk_level != "LOW":
        findings.append(
            RiskFinding(
                "SUPPLIER_PROFILE_RISK",
                supplier_risk_level,
                f"Supplier profile is classified as {supplier_risk_level} risk.",
            )
        )

    # Deduplicate exact codes while preserving first-seen deterministic order.
    unique: dict[str, RiskFinding] = {}
    for finding in findings:
        unique.setdefault(finding.code, finding)

    return QuoteRiskAssessment(
        level=level,
        score=_risk_score(level),
        expected_delivery_date=expected,
        delivery_slack_days=slack,
        findings=tuple(unique.values()),
    )
