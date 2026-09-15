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


async def get_dashboard_data(db: AsyncSession) -> ProcurementDashboardData:
    requisitions = (await db.execute(select(Requisition))).scalars().all()
    
    # Count all PRs that are not in a final 'COMPLETED' state
    open_prs = [pr for pr in requisitions if str(pr.status).upper() != "COMPLETED"]
    exceptions_count = len([pr for pr in requisitions if pr.exceptions])

    from app.models.ai_recommendation import AIRecommendation

    recommendations = (await db.execute(select(AIRecommendation))).scalars().all()
    ready_recs = {r.requisition_id: r for r in recommendations if r.recommendation_state == "READY"}
    suppliers_by_id = {s.id: s for s in (await db.execute(select(Supplier))).scalars().all()}

    pending_approval_prs = [pr for pr in requisitions if str(pr.status).upper() in ("ANALYSIS_READY", "AWAITING_APPROVAL")]

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
        status_str = str(pr.status).upper()
        if status_str in ("COMPLETED", "PO_CREATED", "APPROVED", "RECEIVED", "VALIDATING", "READY_FOR_SOURCING"):
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
        elif status_str in ("RFQ_IN_PROGRESS", "RESPONSES_RECEIVED"):
            rfq_result = await db.execute(
                select(RFQ).where(RFQ.requisition_id == pr.id).options(selectinload(RFQ.recipients))
            )
            rfqs = rfq_result.scalars().all()
            recipients = [r for rfq in rfqs for r in rfq.recipients]
            responded = len([r for r in recipients if str(r.status).upper() == "RESPONDED"])
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
    estimated_savings = 0.0
    
    for quote in quotes:
        supplier = suppliers_by_id.get(quote.supplier_id)
        benchmark = supplier.average_unit_price_amount if supplier else None
        
        if benchmark and quote.unit_price_amount:
            if quote.unit_price_amount > benchmark * 1.03:
                negotiation_count += 1
            elif quote.unit_price_amount < benchmark:
                quantity = quote.quantity or 1
                savings = (benchmark - quote.unit_price_amount) * quantity
                estimated_savings += savings

        if str(quote.validation_status).upper() == "NEEDS_REVIEW":
            price_anomalies += 1

    deliveries = (await db.execute(select(Delivery))).scalars().all()
    delivery_risks = len([
        d for d in deliveries 
        if str(d.risk_level).upper() in ("HIGH", "MEDIUM") or str(d.status).upper() == "AT_RISK"
    ])

    quality_risks = len(
        [
            s
            for s in suppliers_by_id.values()
            if s.quality_acceptance_rate is not None and s.quality_acceptance_rate < 0.93
        ]
    )

    savings_payload = None
    if estimated_savings > 0:
        savings_payload = {"amount": round(estimated_savings, 2), "currency": "INR"}

    return ProcurementAiOpportunities(
        negotiation_count=negotiation_count,
        price_anomalies=price_anomalies,
        delivery_risks=delivery_risks,
        quality_risks=quality_risks,
        estimated_savings=savings_payload,
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