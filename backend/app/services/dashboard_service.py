from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.ai_recommendation import AgentRun
from app.models.delivery import Delivery
from app.models.purchase_order import PurchaseOrder
from app.models.quote import Quote
from app.models.requisition import Requisition
from app.models.rfq import RFQ
from app.models.supplier import Supplier
from app.schemas.requisition import (
    ActivityEvent,
    AIStandingBrief,
    AIStandingBriefPill,
    ProcurementAiOpportunities,
    ProcurementDashboardData,
    ProcurementDashboardSummary,
    ProcurementTask,
)

"""
Everything here is genuinely derived from seeded rows — sourced counts,
computed heuristics, template-filled summaries — not a reproduction of the
specific hand-authored copy the frontend's Phase 1 mock data used (e.g.
the exact sentence "Current quote 12.4% above historical benchmark on two
of three lines"). Matching that literal wording would mean hardcoding
fake "AI-generated" text in a service function, which is worse than
admitting the two won't read identically until Phase 5's real agents
generate this text for real. See docs/architecture/backend-contract-
parity.md for the honest scope of what Phase 3 does and doesn't
reproduce.
"""


async def get_dashboard_data(db: AsyncSession) -> ProcurementDashboardData:
    requisitions = (await db.execute(select(Requisition))).scalars().all()
    open_prs = [pr for pr in requisitions if pr.status != "COMPLETED"]
    exceptions_count = len([pr for pr in requisitions if pr.exceptions])

    from app.models.ai_recommendation import AIRecommendation

    recommendations = (await db.execute(select(AIRecommendation))).scalars().all()
    ready_recs = {r.requisition_id: r for r in recommendations if r.recommendation_state == "READY"}
    suppliers_by_id = {s.id: s for s in (await db.execute(select(Supplier))).scalars().all()}

    pending_approval_prs = [pr for pr in requisitions if pr.status in ("ANALYSIS_READY", "AWAITING_APPROVAL")]

    summary = ProcurementDashboardSummary(
        open_prs=len(open_prs),
        recommendations_ready=len(ready_recs),
        pending_approvals=len(pending_approval_prs),
        exceptions=exceptions_count,
    )

    decision_queue = await _build_decision_queue(db, requisitions, ready_recs, suppliers_by_id)
    ai_opportunities = await _build_ai_opportunities(db, suppliers_by_id)
    recent_activity = await _build_recent_activity(db)
    standing_brief = _build_standing_brief(summary, ai_opportunities)

    return ProcurementDashboardData(
        summary=summary,
        decision_queue=decision_queue,
        ai_opportunities=ai_opportunities,
        recent_activity=recent_activity,
        standing_brief=standing_brief,
    )


async def _build_decision_queue(db, requisitions, ready_recs, suppliers_by_id) -> list[ProcurementTask]:
    tasks: list[ProcurementTask] = []
    for pr in requisitions:
        if pr.status in ("COMPLETED", "PO_CREATED", "APPROVED", "RECEIVED", "VALIDATING", "READY_FOR_SOURCING"):
            continue

        if pr.id in ready_recs:
            rec = ready_recs[pr.id]
            matched_supplier = suppliers_by_id.get(rec.supplier_id)
            supplier_name = matched_supplier.name if matched_supplier else "Supplier"
            tasks.append(
                ProcurementTask(
                    id=f"task-{pr.id}",
                    pr_id=pr.id,
                    pr_number=pr.pr_number,
                    material_name=pr.material_name,
                    priority="READY",
                    headline=f"{supplier_name} ranked #1 — recommendation ready",
                    detail=f"AI recommendation ready · confidence {round(rec.confidence * 100)}%",
                    action_label="Decide",
                    action_href=f"/requisitions/{pr.pr_number}/decision",
                )
            )
        elif pr.exceptions:
            tasks.append(
                ProcurementTask(
                    id=f"task-{pr.id}",
                    pr_id=pr.id,
                    pr_number=pr.pr_number,
                    material_name=pr.material_name,
                    priority="HIGH",
                    headline=f"{len(pr.exceptions)} exception(s) flagged on this requisition",
                    detail="AI monitoring exception status",
                    action_label="Review",
                    action_href=f"/requisitions/{pr.pr_number}",
                )
            )
        elif pr.status in ("RFQ_IN_PROGRESS", "RESPONSES_RECEIVED"):
            rfq_result = await db.execute(
                select(RFQ).where(RFQ.requisition_id == pr.id).options(selectinload(RFQ.recipients))
            )
            rfqs = rfq_result.scalars().all()
            recipients = [r for rfq in rfqs for r in rfq.recipients]
            responded = len([r for r in recipients if r.status == "RESPONDED"])
            if recipients:
                tasks.append(
                    ProcurementTask(
                        id=f"task-{pr.id}",
                        pr_id=pr.id,
                        pr_number=pr.pr_number,
                        material_name=pr.material_name,
                        priority="MEDIUM",
                        headline=f"{responded} of {len(recipients)} suppliers responded",
                        detail="AI monitoring supplier responses",
                        action_label="Review",
                        action_href=f"/requisitions/{pr.pr_number}/sourcing",
                    )
                )

        if len(tasks) >= 4:
            break

    return tasks


async def _build_ai_opportunities(db: AsyncSession, suppliers_by_id: dict) -> ProcurementAiOpportunities:
    quotes = (await db.execute(select(Quote))).scalars().all()

    negotiation_count = 0
    price_anomalies = 0
    for quote in quotes:
        supplier = suppliers_by_id.get(quote.supplier_id)
        benchmark = supplier.average_unit_price_amount if supplier else None
        if benchmark and quote.unit_price_amount > benchmark * 1.03:
            negotiation_count += 1
        if quote.validation_status == "NEEDS_REVIEW":
            price_anomalies += 1

    deliveries = (await db.execute(select(Delivery))).scalars().all()
    delivery_risks = len([d for d in deliveries if d.risk_level in ("HIGH", "MEDIUM") or d.status == "AT_RISK"])

    quality_risks = len(
        [
            s
            for s in suppliers_by_id.values()
            if s.quality_acceptance_rate is not None and s.quality_acceptance_rate < 0.93
        ]
    )

    return ProcurementAiOpportunities(
        negotiation_count=negotiation_count,
        price_anomalies=price_anomalies,
        delivery_risks=delivery_risks,
        quality_risks=quality_risks,
    )


async def _build_recent_activity(db: AsyncSession) -> list[ActivityEvent]:
    events: list[tuple[datetime, ActivityEvent]] = []

    runs = (
        (
            await db.execute(
                select(AgentRun).where(AgentRun.status == "COMPLETED").options(selectinload(AgentRun.requisition))
            )
        )
        .scalars()
        .all()
    )
    for run in runs:
        if run.completed_at is None:
            continue
        events.append(
            (
                run.completed_at,
                ActivityEvent(
                    id=f"activity-run-{run.id}",
                    message=f"{run.label} completed — {run.requisition.pr_number}",
                    occurred_at=run.completed_at,
                    entity_href=run.output_href,
                ),
            )
        )

    pos = (await db.execute(select(PurchaseOrder).where(PurchaseOrder.sent_at.is_not(None)))).scalars().all()
    for po in pos:
        events.append(
            (
                po.sent_at,
                ActivityEvent(
                    id=f"activity-po-{po.id}",
                    message=f"{po.po_number} sent to supplier",
                    occurred_at=po.sent_at,
                    entity_href=f"/purchase-orders/{po.po_number}",
                ),
            )
        )

    events.sort(key=lambda pair: pair[0], reverse=True)
    return [event for _, event in events[:4]]


def _build_standing_brief(
    summary: ProcurementDashboardSummary, opportunities: ProcurementAiOpportunities
) -> AIStandingBrief:
    """
    Template-filled from real aggregate numbers — not a language-model
    output. Labeled honestly as such rather than dressed up to look
    AI-generated; Phase 5's real Procurement Analyst / Risk agents replace
    this function's body with an actual synthesized summary.
    """
    paragraphs = [
        f"{summary.recommendations_ready} procurement decision(s) currently have a ready AI recommendation "
        f"awaiting review.",
    ]
    if opportunities.delivery_risks > 0:
        paragraphs.append(
            f"{opportunities.delivery_risks} delivery/deliveries are flagged at elevated risk and may need "
            f"a follow-up with the supplier."
        )

    pills = [AIStandingBriefPill(label=f"Status: {summary.recommendations_ready} ready", tone="ai")]
    if opportunities.delivery_risks > 0:
        pills.append(AIStandingBriefPill(label=f"{opportunities.delivery_risks} delivery exception(s)", tone="danger"))

    return AIStandingBrief(paragraphs=paragraphs, status_pills=pills, generated_at=datetime.now(UTC))
