from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.calculations.supplier_score import SUPPLIER_SCORE_CONFIG
from app.core.exceptions import NotFoundError
from app.models.supplier import Supplier as SupplierModel
from app.schemas.common import Money
from app.schemas.supplier import (
    Supplier,
    SupplierDetailData,
    SupplierPerformanceMetrics,
    SupplierPerformanceTrends,
    SupplierPricePoint,
    SupplierScoreBreakdown,
    SupplierTransaction,
)
from app.services.intelligence_service import build_supplier_score


def _performance(s: SupplierModel) -> SupplierPerformanceMetrics | None:
    if s.on_time_delivery_rate is None:
        return None
    return SupplierPerformanceMetrics(
        on_time_delivery_rate=s.on_time_delivery_rate,
        quality_acceptance_rate=s.quality_acceptance_rate or 0,
        response_rate=s.response_rate or 0,
        average_unit_price=(
            Money(currency=s.average_unit_price_currency or "INR", amount=s.average_unit_price_amount)
            if s.average_unit_price_amount is not None
            else None
        ),
        total_purchases=s.total_purchases,
        sample_size_units=s.sample_size_units,
        sample_size_transactions=s.sample_size_transactions,
        measured_at=s.performance_measured_at,
    )


def _score_from_calculated(values: dict) -> SupplierScoreBreakdown:
    return SupplierScoreBreakdown(
        overall=values["overall"],
        price=values["price"],
        quality=values["quality"],
        delivery=values["delivery"],
        commercial=values["commercial"],
        config_version=values["config_version"],
    )


async def to_schema(db: AsyncSession, s: SupplierModel) -> Supplier:
    calculated = await build_supplier_score(db, s, payment_terms_days=None)
    return Supplier(
        id=s.id,
        code=s.code,
        name=s.name,
        approval_status=s.approval_status,
        risk_level=s.risk_level,
        categories=s.categories,
        performance=_performance(s),
        score_breakdown=_score_from_calculated(calculated),
    )


async def list_suppliers(db: AsyncSession) -> list[Supplier]:
    result = await db.execute(
        select(SupplierModel).options(selectinload(SupplierModel.price_history))
    )
    suppliers = result.scalars().all()
    return [await to_schema(db, s) for s in suppliers]


async def _get_orm_or_404(db: AsyncSession, code_or_id: str) -> SupplierModel:
    result = await db.execute(
        select(SupplierModel)
        .where((SupplierModel.code == code_or_id) | (SupplierModel.id == code_or_id))
        .options(selectinload(SupplierModel.price_history), selectinload(SupplierModel.transactions))
    )
    supplier = result.scalar_one_or_none()
    if supplier is None:
        raise NotFoundError(f"Supplier {code_or_id} not found", code="supplier_not_found")
    return supplier


async def get_supplier_detail(db: AsyncSession, code_or_id: str) -> SupplierDetailData:
    s = await _get_orm_or_404(db, code_or_id)
    performance = _performance(s)
    if performance is None:
        raise NotFoundError(f"Supplier {code_or_id} has no performance data yet", code="supplier_performance_missing")
    score = _score_from_calculated(await build_supplier_score(db, s, payment_terms_days=None))
    supplier = Supplier(
        id=s.id,
        code=s.code,
        name=s.name,
        approval_status=s.approval_status,
        risk_level=s.risk_level,
        categories=s.categories,
        performance=performance,
        score_breakdown=score,
    )
    return SupplierDetailData(
        supplier=supplier,
        performance=performance,
        score_breakdown=score,
        trends=SupplierPerformanceTrends(price="STABLE", delivery="STABLE", quality="STABLE"),
        price_history=[
            SupplierPricePoint(
                date=p.occurred_on,
                unit_price=Money(currency=p.unit_price_currency, amount=p.unit_price_amount),
                po_reference=p.po_reference,
            )
            for p in s.price_history
        ],
        recent_transactions=[
            SupplierTransaction(
                id=t.id,
                po_reference=t.po_reference,
                material_name=t.material_name,
                unit_price=Money(currency=t.unit_price_currency, amount=t.unit_price_amount),
                delivered_on_time=t.delivered_on_time,
                quality_accepted=t.quality_accepted,
                occurred_at=t.occurred_on,
            )
            for t in s.transactions
        ],
    )
