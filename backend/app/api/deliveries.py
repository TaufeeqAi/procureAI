from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.delivery import Delivery
from app.services import delivery_service

router = APIRouter(prefix="/deliveries", tags=["deliveries"])


@router.get("", response_model=list[Delivery], response_model_by_alias=True)
async def list_deliveries(db: DbSession) -> list[Delivery]:
    return await delivery_service.list_deliveries(db)


@router.get("/{po_number}", response_model=Delivery, response_model_by_alias=True)
async def get_delivery_detail(po_number: str, db: DbSession) -> Delivery:
    return await delivery_service.get_delivery_detail(db, po_number)
