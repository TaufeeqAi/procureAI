from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.requisition import NavCounts, ProcurementDashboardData
from app.services import dashboard_service, requisition_service, rfq_service

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=ProcurementDashboardData, response_model_by_alias=True)
async def get_dashboard(db: DbSession) -> ProcurementDashboardData:
    return await dashboard_service.get_dashboard_data(db)


@router.get("/nav-counts", response_model=NavCounts, response_model_by_alias=True)
async def get_nav_counts(db: DbSession) -> NavCounts:
    """Backs the sidebar's live count badges — a separate, cheap endpoint
    from /dashboard so the shell (fetched on every navigation) doesn't
    pull the full Command Center payload just for four small numbers."""
    requisitions = await requisition_service.list_requisitions(db)
    return NavCounts(
        pr_queue=len(requisitions),
        awaiting_supplier=len([r for r in requisitions if r.status == "RFQ_IN_PROGRESS"]),
        awaiting_decision=len([r for r in requisitions if r.status in ("ANALYSIS_READY", "RESPONSES_RECEIVED")]),
        exceptions=len([r for r in requisitions if r.exceptions]),
        supplier_inbox=await rfq_service.count_responded_recipients(db),
    )
