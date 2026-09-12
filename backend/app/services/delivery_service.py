from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models.delivery import Delivery as DeliveryModel
from app.models.purchase_order import PurchaseOrder
from app.schemas.delivery import Delivery as DeliverySchema
from app.schemas.delivery import DeliveryExceptionSchema, DeliveryTimelineStep


def _to_schema(d: DeliveryModel) -> DeliverySchema:
    po = d.purchase_order
    line_item = po.line_items[0] if po.line_items else None
    return DeliverySchema(
        id=d.id,
        po_id=po.id,
        po_number=po.po_number,
        supplier_id=po.supplier_id,
        supplier_name=po.supplier.name,
        material_name=line_item.material_name if line_item else "",
        expected_date=d.expected_date,
        quantity_ordered=d.quantity_ordered,
        quantity_received=d.quantity_received,
        status=d.status,
        risk_level=d.risk_level,
        timeline=[DeliveryTimelineStep(key=t.key, label=t.label, completed=t.completed) for t in d.timeline],
        exceptions=[
            DeliveryExceptionSchema(
                id=e.id,
                severity=e.severity,
                message=e.message,
                detected_at=e.detected_at,
                suggested_action_label=e.suggested_action_label,
            )
            for e in d.exceptions
        ],
        last_supplier_communication_at=d.last_supplier_communication_at,
    )


def _eager_load_options():
    """Shared between list and detail queries so the two can never drift
    apart on which relationships get loaded — a mismatch here is exactly
    how a MissingGreenlet lazy-load bug reappears in one code path after
    being fixed in the other."""
    return (
        selectinload(DeliveryModel.purchase_order).selectinload(PurchaseOrder.supplier),
        selectinload(DeliveryModel.purchase_order).selectinload(PurchaseOrder.line_items),
        selectinload(DeliveryModel.timeline),
        selectinload(DeliveryModel.exceptions),
    )


async def list_deliveries(db: AsyncSession) -> list[DeliverySchema]:
    result = await db.execute(select(DeliveryModel).options(*_eager_load_options()))
    return [_to_schema(d) for d in result.scalars().all()]


async def get_delivery_detail(db: AsyncSession, po_number: str) -> DeliverySchema:
    result = await db.execute(
        select(DeliveryModel)
        .join(PurchaseOrder, DeliveryModel.purchase_order_id == PurchaseOrder.id)
        .where(PurchaseOrder.po_number == po_number)
        .options(*_eager_load_options())
    )
    delivery = result.scalar_one_or_none()
    if delivery is None:
        raise NotFoundError(f"Delivery for {po_number} not found", code="delivery_not_found")
    return _to_schema(delivery)
