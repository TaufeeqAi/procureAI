from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.rfq import RFQ
from app.services import rfq_service

router = APIRouter(prefix="/rfqs", tags=["rfqs"])


@router.get("", response_model=list[RFQ], response_model_by_alias=True)
async def list_rfqs(db: DbSession) -> list[RFQ]:
    return await rfq_service.list_rfqs(db)


@router.get("/{rfq_number}", response_model=RFQ, response_model_by_alias=True)
async def get_rfq_detail(rfq_number: str, db: DbSession) -> RFQ:
    return await rfq_service.get_rfq_detail(db, rfq_number)
