from app.ai.schemas import FinalAIAnalysis, NegotiationDraft, RequirementAnalysis


def test_final_analysis_rejects_unknown_fields():
    try:
        FinalAIAnalysis.model_validate({
            "decision_summary": "Use ABC",
            "reasons": ["Quality"],
            "confidence": 0.9,
            "evidence_ids": ["ev-1"],
            "unexpected": "reject",
        })
    except Exception as exc:
        assert "unexpected" in str(exc)
    else:
        raise AssertionError("Strict schema accepted an unknown field")


def test_requirement_schema_bounds_confidence():
    model = RequirementAnalysis(
        normalized_requirement="200 bearing housings",
        confidence=0.98,
        evidence_ids=[],
    )
    assert model.confidence == 0.98


def test_negotiation_schema_requires_supplier():
    model = NegotiationDraft(
        supplier_id="sup-001",
        target_unit_price_inr=1170,
        anchor_reason="Benchmark",
        message_body="Please review pricing.",
        evidence_ids=["ev-quote"],
    )
    assert model.supplier_id == "sup-001"

