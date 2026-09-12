from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models.purchase_order import PurchaseOrder as PurchaseOrderModel
from app.schemas.common import Money
from app.schemas.purchase_order import POLineItem, POListItem, POValidationCheck
from app.schemas.purchase_order import PurchaseOrder as PurchaseOrderSchema
from app.schemas.quote import LandedCostBreakdown


def to_schema(po: PurchaseOrderModel) -> PurchaseOrderSchema:
    return PurchaseOrderSchema(
        id=po.id,
        po_number=po.po_number,
        pr_id=po.requisition_id,
        pr_number=po.requisition.pr_number,
        supplier_id=po.supplier_id,
        supplier_name=po.supplier.name,
        status=po.status,
        line_items=[
            POLineItem(
                material_name=li.material_name,
                quantity=li.quantity,
                unit_price=Money(currency=li.unit_price_currency, amount=li.unit_price_amount),
                line_value=Money(currency=li.unit_price_currency, amount=li.line_value_amount),
                expected_delivery=li.expected_delivery,
            )
            for li in po.line_items
        ],
        # The PO's cost breakdown is stored, not recomputed — see
        # app/models/purchase_order.py's docstring on why a placed order's
        # total must stay fixed even if the pricing formula changes later.
        cost_breakdown=LandedCostBreakdown(
            subtotal=Money(currency=po.currency, amount=po.subtotal_amount),
            freight=Money(currency=po.currency, amount=po.freight_amount),
            tax_amount=Money(currency=po.currency, amount=po.tax_amount),
            tax_rate_percent=po.tax_rate_percent,
            total=Money(currency=po.currency, amount=po.total_amount),
        ),
        payment_terms_days=po.payment_terms_days,
        validation_checks=[POValidationCheck.model_validate(c) for c in po.validation_checks],
        created_at=po.created_at,
        sent_at=po.sent_at,
        acknowledged_at=po.acknowledged_at,
    )


async def list_purchase_orders(db: AsyncSession) -> list[POListItem]:
    result = await db.execute(
        select(PurchaseOrderModel).options(
            selectinload(PurchaseOrderModel.supplier), selectinload(PurchaseOrderModel.line_items)
        )
    )
    return [
        POListItem(
            id=po.id,
            po_number=po.po_number,
            supplier_name=po.supplier.name,
            value=Money(currency=po.currency, amount=po.total_amount),
            expected_delivery=po.line_items[0].expected_delivery if po.line_items else po.created_at.date(),
            status=po.status,
        )
        for po in result.scalars().all()
    ]


async def get_purchase_order_detail(db: AsyncSession, po_number: str) -> PurchaseOrderSchema:
    result = await db.execute(
        select(PurchaseOrderModel)
        .where(PurchaseOrderModel.po_number == po_number)
        .options(
            selectinload(PurchaseOrderModel.supplier),
            selectinload(PurchaseOrderModel.requisition),
            selectinload(PurchaseOrderModel.line_items),
        )
    )
    po = result.scalar_one_or_none()
    if po is None:
        raise NotFoundError(f"Purchase order {po_number} not found", code="purchase_order_not_found")
    return to_schema(po)
