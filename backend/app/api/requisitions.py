from fastapi import APIRouter, Query

from app.api.deps import DbSession
from app.schemas.requisition import PRDetailData, PRTimelineData, RequirementValidation
from app.schemas.requisition import Requisition as RequisitionSchema
from app.services import requisition_service

router = APIRouter(prefix="/requisitions", tags=["requisitions"])


@router.get("", response_model=list[RequisitionSchema], response_model_by_alias=True)
async def list_requisitions(
    db: DbSession,
    filter: str | None = Query(default=None, pattern="^(awaiting-supplier|awaiting-decision|exceptions)$"),
) -> list[RequisitionSchema]:
    return await requisition_service.list_requisitions(db, status_filter=filter)


@router.get("/{pr_number}", response_model=PRDetailData, response_model_by_alias=True)
async def get_requisition_detail(pr_number: str, db: DbSession) -> PRDetailData:
    return await requisition_service.get_requisition_detail(db, pr_number)


@router.get("/{pr_number}/requirement", response_model=RequirementValidation, response_model_by_alias=True)
async def get_requirement_validation(pr_number: str, db: DbSession) -> RequirementValidation:
    return await requisition_service.get_requirement_validation(db, pr_number)


@router.get("/{pr_number}/timeline", response_model=PRTimelineData, response_model_by_alias=True)
async def get_requisition_timeline(pr_number: str, db: DbSession) -> PRTimelineData:
    return await requisition_service.get_requisition_timeline(db, pr_number)
