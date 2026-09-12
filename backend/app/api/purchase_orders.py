from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.purchase_order import POListItem
from app.schemas.purchase_order import PurchaseOrder as PurchaseOrderSchema
from app.services import purchase_order_service

router = APIRouter(prefix="/purchase-orders", tags=["purchase-orders"])


@router.get("", response_model=list[POListItem], response_model_by_alias=True)
async def list_purchase_orders(db: DbSession) -> list[POListItem]:
    return await purchase_order_service.list_purchase_orders(db)


@router.get("/{po_number}", response_model=PurchaseOrderSchema, response_model_by_alias=True)
async def get_purchase_order_detail(po_number: str, db: DbSession) -> PurchaseOrderSchema:
    return await purchase_order_service.get_purchase_order_detail(db, po_number)
