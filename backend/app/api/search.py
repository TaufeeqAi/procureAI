from fastapi import APIRouter, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession
from app.models.purchase_order import PurchaseOrder as PurchaseOrderModel
from app.models.quote import Quote as QuoteModel
from app.models.requisition import Requisition as RequisitionModel
from app.models.supplier import Supplier as SupplierModel
from app.schemas.common import CamelModel
from app.services import (
    purchase_order_service,
    quote_service,
    requisition_service,
    supplier_service,
)

router = APIRouter(tags=["search"])


class SearchResults(CamelModel):
    requisitions: list
    suppliers: list
    purchase_orders: list
    quotes: list


@router.get("/search", response_model=SearchResults, response_model_by_alias=True)
async def search(db: DbSession, q: str = Query(default="", min_length=0)) -> SearchResults:
    """
    One query per entity type rather than a single UNION query — the
    result shapes are different enough (Requisition vs Supplier vs
    PurchaseOrder vs Quote) that a UNION would need to project down to a
    lowest-common-denominator shape, losing exactly the fields each
    result card needs. Mirrors lib/mock/queries.ts's `search` on the
    frontend, which makes the same call for the same reason.

    Each branch eager-loads what its own `to_schema` needs and converts
    directly from the row already in hand — not by re-querying the
    detail endpoint's service function a second time by string ID, which
    would turn one search into up to four times as many round trips.
    """
    if not q.strip():
        return SearchResults(requisitions=[], suppliers=[], purchase_orders=[], quotes=[])

    like = f"%{q.strip()}%"

    pr_rows = (
        await db.execute(
            select(RequisitionModel).where(
                or_(RequisitionModel.pr_number.ilike(like), RequisitionModel.material_name.ilike(like))
            )
        )
    ).scalars().all()

    supplier_rows = (
        await db.execute(
            select(SupplierModel).where(or_(SupplierModel.name.ilike(like), SupplierModel.code.ilike(like)))
        )
    ).scalars().all()

    po_rows = (
        await db.execute(
            select(PurchaseOrderModel)
            .where(PurchaseOrderModel.po_number.ilike(like))
            .options(
                selectinload(PurchaseOrderModel.supplier),
                selectinload(PurchaseOrderModel.requisition),
                selectinload(PurchaseOrderModel.line_items),
            )
        )
    ).scalars().all()

    quote_rows = (
        await db.execute(
            select(QuoteModel)
            .where(QuoteModel.quote_reference.ilike(like))
            .options(selectinload(QuoteModel.supplier), selectinload(QuoteModel.requisition))
        )
    ).scalars().all()

    return SearchResults(
        requisitions=[requisition_service.to_schema(pr) for pr in pr_rows],
        suppliers=[supplier_service.to_schema(s) for s in supplier_rows],
        purchase_orders=[purchase_order_service.to_schema(po) for po in po_rows],
        quotes=[quote_service.to_schema(quote, quote.requisition.pr_number) for quote in quote_rows],
    )
