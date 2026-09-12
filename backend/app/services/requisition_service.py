from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models.quote import Quote
from app.models.requisition import Requisition as RequisitionModel
from app.models.rfq import RFQ
from app.schemas.common import Money
from app.schemas.procurement_common import WORKFLOW_STEP_ORDER
from app.schemas.requisition import (
    MaterialRequirement,
    PRDetailData,
    PRTimelineData,
    PRTimelineEntry,
    RequirementValidation,
    RequirementValidationField,
    SourcingState,
    SupplierSummary,
    SupplierSummaryHighlight,
    WorkflowState,
    WorkflowStep,
)
from app.schemas.requisition import Requisition as RequisitionSchema


def to_schema(pr: RequisitionModel) -> RequisitionSchema:
    return RequisitionSchema(
        id=pr.id,
        pr_number=pr.pr_number,
        material=MaterialRequirement(
            material_name=pr.material_name,
            part_code=pr.part_code,
            quantity=pr.quantity,
            unit=pr.unit,
            application=pr.application,
            drawing_reference=pr.drawing_reference,
            drawing_revision_available=pr.drawing_revision_available,
        ),
        required_date=pr.required_date,
        requesting_department=pr.requesting_department,
        status=pr.status,
        exceptions=pr.exceptions,
        estimated_value=(
            Money(currency=pr.estimated_value_currency, amount=pr.estimated_value_amount)
            if pr.estimated_value_amount is not None
            else None
        ),
        created_at=pr.created_at,
        updated_at=pr.updated_at,
        has_been_analyzed=pr.has_been_analyzed,
    )


async def list_requisitions(db: AsyncSession, status_filter: str | None = None) -> list[RequisitionSchema]:
    result = await db.execute(select(RequisitionModel))
    prs = result.scalars().all()

    if status_filter == "awaiting-supplier":
        prs = [pr for pr in prs if pr.status == "RFQ_IN_PROGRESS"]
    elif status_filter == "awaiting-decision":
        prs = [pr for pr in prs if pr.status in ("ANALYSIS_READY", "RESPONSES_RECEIVED")]
    elif status_filter == "exceptions":
        prs = [pr for pr in prs if pr.exceptions]

    return [to_schema(pr) for pr in prs]


async def _get_orm_or_404(db: AsyncSession, pr_number: str) -> RequisitionModel:
    result = await db.execute(select(RequisitionModel).where(RequisitionModel.pr_number == pr_number))
    pr = result.scalar_one_or_none()
    if pr is None:
        raise NotFoundError(f"Requisition {pr_number} not found", code="requisition_not_found")
    return pr


async def get_requisition(db: AsyncSession, pr_number: str) -> RequisitionSchema:
    return to_schema(await _get_orm_or_404(db, pr_number))


def _build_workflow_state(status: str) -> WorkflowState:
    """Mirrors lib/mock/queries.ts's `buildWorkflowState` on the frontend
    exactly, including which statuses map to which step index — see
    docs/architecture/state-machines.md's PR lifecycle diagram, the shared
    source of truth both implementations follow."""
    step_keys = list(WORKFLOW_STEP_ORDER.keys())
    try:
        current_index = step_keys.index(status)
    except ValueError:
        current_index = -1

    steps = [
        WorkflowStep(
            key=key, label=label, completed=current_index >= 0 and i < current_index, current=i == current_index
        )
        for i, (key, label) in enumerate(WORKFLOW_STEP_ORDER.items())
    ]
    return WorkflowState(steps=steps)


async def get_requisition_detail(db: AsyncSession, pr_number: str) -> PRDetailData:
    pr = await _get_orm_or_404(db, pr_number)

    rfq_result = await db.execute(
        select(RFQ).where(RFQ.requisition_id == pr.id).options(selectinload(RFQ.recipients))
    )
    rfqs = rfq_result.scalars().all()
    recipients = [r for rfq in rfqs for r in rfq.recipients]
    responded = [r for r in recipients if r.status == "RESPONDED"]

    from app.models.supplier import Supplier

    eligible_count = (await db.execute(select(Supplier).where(Supplier.approval_status == "APPROVED"))).scalars().all()

    sourcing_state = SourcingState(
        eligible_supplier_count=len(eligible_count),
        contacted_supplier_count=len(recipients),
        responded_supplier_count=len(responded),
        # No dedicated "historical comparable purchases" query exists yet —
        # this would need a join across Quote/PurchaseOrder by material
        # category, which Phase 4's analytics layer is the right place to
        # build. Zero here is honest about that gap rather than a
        # plausible-looking placeholder number.
        comparable_historical_purchases=0,
    )

    quote_result = await db.execute(
        select(Quote).where(Quote.requisition_id == pr.id).options(selectinload(Quote.supplier))
    )
    quotes = quote_result.scalars().all()

    highlights: list[SupplierSummaryHighlight] = []
    if quotes:
        best_price_quote = min(quotes, key=lambda q: q.unit_price_amount)
        highlights.append(
            SupplierSummaryHighlight(
                label="BEST_PRICE",
                supplier_id=best_price_quote.supplier_id,
                supplier_name=best_price_quote.supplier.name,
                value=f"₹{best_price_quote.unit_price_amount:,.0f}",
            )
        )
        best_delivery_supplier = max(
            (q.supplier for q in quotes if q.supplier.on_time_delivery_rate is not None),
            key=lambda s: s.on_time_delivery_rate,
            default=None,
        )
        if best_delivery_supplier:
            highlights.append(
                SupplierSummaryHighlight(
                    label="BEST_DELIVERY",
                    supplier_id=best_delivery_supplier.id,
                    supplier_name=best_delivery_supplier.name,
                    value=f"{best_delivery_supplier.on_time_delivery_rate * 100:.0f}% OTD",
                )
            )
        best_overall_supplier = max(
            (q.supplier for q in quotes if q.supplier.score_overall is not None),
            key=lambda s: s.score_overall,
            default=None,
        )
        if best_overall_supplier:
            highlights.append(
                SupplierSummaryHighlight(
                    label="BEST_OVERALL",
                    supplier_id=best_overall_supplier.id,
                    supplier_name=best_overall_supplier.name,
                    value=f"{best_overall_supplier.score_overall:.1f} score",
                )
            )

    return PRDetailData(
        requisition=to_schema(pr),
        requirement_validation=await get_requirement_validation(db, pr_number),
        sourcing_state=sourcing_state,
        supplier_summary=SupplierSummary(highlights=highlights),
        workflow_state=_build_workflow_state(pr.status),
    )


async def get_requirement_validation(db: AsyncSession, pr_number: str) -> RequirementValidation:
    """
    Recomputes the requirement check from the PR's current fields on
    every call, rather than reading a stored validation row — this is
    deliberately a pure function of current state, matching how the
    frontend's Requirement Agent is described (Section 17 of the master
    plan): re-run, not a cached judgment that can go stale silently.
    Phase 5 replaces this rule-based version with a real LLM extraction
    pass; the return shape doesn't change.
    """
    pr = await _get_orm_or_404(db, pr_number)

    fields = [
        RequirementValidationField(field="materialName", label="Material", status="CONFIRMED", confidence=0.99),
        RequirementValidationField(field="quantity", label="Quantity", status="CONFIRMED", confidence=0.99),
        RequirementValidationField(field="requiredDate", label="Required date", status="CONFIRMED", confidence=0.97),
        RequirementValidationField(
            field="application",
            label="Application",
            status="CONFIRMED" if pr.application else "MISSING",
            confidence=0.91 if pr.application else None,
        ),
        RequirementValidationField(
            field="drawingReference",
            label="Specification",
            status="CONFIRMED" if pr.drawing_revision_available else "MISSING",
            confidence=0.95 if pr.drawing_revision_available else None,
        ),
    ]

    blocking_issues = []
    if not pr.drawing_revision_available:
        blocking_issues.append("Drawing revision has not been provided.")

    return RequirementValidation(
        pr_id=pr.id, fields=fields, blocking_issues=blocking_issues, evaluated_at=datetime.now(UTC)
    )


async def get_requisition_timeline(db: AsyncSession, pr_number: str) -> PRTimelineData:
    pr = await _get_orm_or_404(db, pr_number)

    from app.models.ai_recommendation import AgentRun

    runs_result = await db.execute(select(AgentRun).where(AgentRun.requisition_id == pr.id))
    runs = runs_result.scalars().all()

    entries = [
        PRTimelineEntry(
            id="tl-received",
            label="PR received",
            description=f"{pr.material_name} requisition entered the queue",
            occurred_at=pr.created_at,
        )
    ]
    for run in runs:
        entries.append(
            PRTimelineEntry(
                id=run.id,
                label=run.label,
                description=run.summary,
                occurred_at=run.completed_at or run.started_at,
            )
        )

    entries.sort(key=lambda e: e.occurred_at)
    return PRTimelineData(pr_id=pr.id, entries=entries)
