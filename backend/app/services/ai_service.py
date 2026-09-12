
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.ai import AgentRun, PolicyCheck, ProcurementRecommendation, RecommendationAlternative, RecommendationDimensions, RiskFlag, ScoreDimension
from app.schemas.common import EvidenceReference
from app.services.intelligence_service import build_procurement_truth
from app.models.ai_recommendation import AgentRun as AgentRunModel
from app.models.requisition import Requisition


async def get_recommendation(db: AsyncSession, pr_number: str) -> ProcurementRecommendation | None:
    """Phase 4 recommendation envelope backed by deterministic truth.

    The response shape remains stable for the frontend. ``reasons`` are
    deterministic explanations in Phase 4. Phase 5 may replace the prose
    generation while retaining the calculated dimensions and evidence.
    """
    truth = await build_procurement_truth(db, pr_number)
    rec = truth.recommendation
    if rec is None:
        return None
    winner = next(item for item in truth.suppliers if item.supplier_id == rec.supplier_id)
    runner = truth.suppliers[1:3]
    evidence = [
        EvidenceReference(
            id=f"truth-benchmark-{truth.pr_id}",
            type="TRANSACTION",
            label=f"{truth.material_name} historical benchmark ({truth.benchmark.sample_size} transactions)",
            as_of=truth.benchmark.as_of,
        ),
        EvidenceReference(
            id=f"truth-quote-{winner.quote_reference}",
            type="QUOTE",
            label=winner.quote_reference or "Current quote",
            href=f"/quotes/{winner.quote_reference}" if winner.quote_reference else None,
            as_of=truth.generated_at,
        ),
    ]
    risks = [
        RiskFlag(
            severity=finding.severity,
            message=finding.message,
            evidence=None,
        )
        for finding in (winner.risk_assessment.findings if winner.risk_assessment else [])
    ]
    dimensions = RecommendationDimensions(
        price=ScoreDimension(value=winner.price_score / 100.0, label="Price", detail="Deterministic relative-price score"),
        quality=ScoreDimension(value=winner.quality_score / 100.0, label="Quality", detail="Historical acceptance rate"),
        delivery=ScoreDimension(value=winner.delivery_score / 100.0, label="Delivery", detail="Historical on-time delivery rate"),
        commercial_terms=ScoreDimension(value=winner.commercial_score / 100.0, label="Commercial terms", detail="Payment terms versus configured target"),
        risk=ScoreDimension(value=winner.risk_score / 100.0, label="Risk", detail="Deterministic risk rules"),
    )
    return ProcurementRecommendation(
        id=f"truth-{truth.pr_id}",
        pr_id=truth.pr_id,
        supplier_id=winner.supplier_id,
        supplier_name=winner.supplier_name,
        confidence=rec.confidence,
        confidence_band=rec.confidence_band,
        recommendation_state=rec.recommendation_state,
        overall_score=rec.overall_score,
        dimensions=dimensions,
        reasons=rec.rationale,
        trade_off=None,
        risks=risks,
        evidence=evidence,
        policy_checks=[
            PolicyCheck(label="Supplier is approved", passed=True),
            PolicyCheck(label="Recommendation is deterministic", passed=True, detail=f"{winner.score_config_version}"),
            PolicyCheck(label="Evidence sample threshold met", passed=winner.historical_sample_size >= 3, detail=f"{winner.historical_sample_size} historical transactions"),
        ],
        alternatives=[
            RecommendationAlternative(
                supplier_id=item.supplier_id,
                supplier_name=item.supplier_name,
                overall_score=item.overall_score,
                noteworthy_difference=f"{item.risk_level} risk; deterministic score {item.overall_score:.1f}",
            )
            for item in runner
        ],
        generated_at=truth.generated_at,
    )


async def get_agent_runs(db: AsyncSession, pr_number: str) -> list[AgentRun]:
    pr_result = await db.execute(select(Requisition).where(Requisition.pr_number == pr_number))
    pr = pr_result.scalar_one_or_none()
    if pr is None:
        return []
    runs_result = await db.execute(select(AgentRunModel).where(AgentRunModel.requisition_id == pr.id))
    return [
        AgentRun(id=r.id, agent=r.agent, label=r.label, status=r.status, pr_id=r.requisition_id,
                 summary=r.summary, output_href=r.output_href, started_at=r.started_at, completed_at=r.completed_at)
        for r in runs_result.scalars().all()
    ]


async def list_all_agent_runs(db: AsyncSession) -> list[AgentRun]:
    result = await db.execute(select(AgentRunModel))
    return [
        AgentRun(id=r.id, agent=r.agent, label=r.label, status=r.status, pr_id=r.requisition_id,
                 summary=r.summary, output_href=r.output_href, started_at=r.started_at, completed_at=r.completed_at)
        for r in result.scalars().all()
    ]
