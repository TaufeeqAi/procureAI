import enum
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.purchase_order import PurchaseOrder
    from app.models.quote import Quote
    from app.models.rfq import RFQRecipient
    from app.models.user import User



class SupplierApprovalStatus(enum.StrEnum):
    APPROVED = "APPROVED"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    SUSPENDED = "SUSPENDED"


class RiskLevel(enum.StrEnum):
    """Shared across Supplier, Delivery, and AI risk flags — one enum,
    defined once, imported everywhere it's used (mirrors
    frontend/types/common.ts `RiskLevel` being a single shared union
    rather than being redefined per domain object)."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    approval_status: Mapped[SupplierApprovalStatus] = mapped_column(Enum(SupplierApprovalStatus))
    risk_level: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel))

    # A plain JSON list of strings (frontend `categories: string[]`) —
    # not normalized into a join table because nothing in this system
    # queries "all suppliers in category X" yet; see
    # docs/architecture/backend-contract-parity.md for the general rule
    # this follows.
    categories: Mapped[list[str]] = mapped_column(JSON, default=list)

    # SupplierPerformanceMetrics, flattened onto the supplier row rather
    # than a separate table — there is exactly one current performance
    # snapshot per supplier today (no history table yet), so a 1:1 table
    # would only add a join with no query this system performs.
    on_time_delivery_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    quality_acceptance_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    response_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    average_unit_price_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    average_unit_price_currency: Mapped[str | None] = mapped_column(String(3), nullable=True)
    total_purchases: Mapped[int] = mapped_column(Integer, default=0)
    sample_size_units: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sample_size_transactions: Mapped[int] = mapped_column(Integer, default=0)
    performance_measured_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # SupplierScoreBreakdown — deterministic truth-engine output (Phase 4
    # ports app/calculations/supplier_score.py to actually compute these;
    # for Phase 3 they're seeded values, never AI-generated — see
    # docs/architecture/decisions/supplier-score.md on the frontend side).
    score_overall: Mapped[float | None] = mapped_column(Float, nullable=True)
    score_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    score_quality: Mapped[float | None] = mapped_column(Float, nullable=True)
    score_delivery: Mapped[float | None] = mapped_column(Float, nullable=True)
    score_commercial: Mapped[float | None] = mapped_column(Float, nullable=True)
    score_config_version: Mapped[str | None] = mapped_column(String(50), nullable=True)

    users: Mapped[list["User"]] = relationship(back_populates="supplier")
    quotes: Mapped[list["Quote"]] = relationship(back_populates="supplier")
    rfq_recipients: Mapped[list["RFQRecipient"]] = relationship(back_populates="supplier")
    purchase_orders: Mapped[list["PurchaseOrder"]] = relationship(back_populates="supplier")
    price_history: Mapped[list["SupplierPriceHistoryPoint"]] = relationship(
        back_populates="supplier", cascade="all, delete-orphan", order_by="SupplierPriceHistoryPoint.occurred_on"
    )
    transactions: Mapped[list["SupplierTransactionRecord"]] = relationship(
        back_populates="supplier", cascade="all, delete-orphan", order_by="SupplierTransactionRecord.occurred_on.desc()"
    )


class SupplierPriceHistoryPoint(Base):
    """
    Mirrors the frontend's `SupplierPricePoint[]` — seeded as flat rows
    per supplier, the same way lib/mock/queries.ts hand-authored this data
    as a literal array rather than deriving it from purchase-order
    history. A real derivation from PurchaseOrder + POLineItem rows is a
    reasonable Phase 4+ enhancement; Phase 3 matches what the frontend
    already proved out, not more.
    """

    __tablename__ = "supplier_price_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    supplier_id: Mapped[str] = mapped_column(ForeignKey("suppliers.id"), index=True)
    occurred_on: Mapped[date] = mapped_column(Date)
    unit_price_amount: Mapped[float] = mapped_column(Float)
    unit_price_currency: Mapped[str] = mapped_column(String(3), default="INR")
    po_reference: Mapped[str] = mapped_column(String(30))

    supplier: Mapped["Supplier"] = relationship(back_populates="price_history")


class SupplierTransactionRecord(Base):
    """Mirrors the frontend's `SupplierTransaction[]` — see
    SupplierPriceHistoryPoint's docstring for why this is a seeded flat
    table rather than a PO/delivery derivation in Phase 3."""

    __tablename__ = "supplier_transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    supplier_id: Mapped[str] = mapped_column(ForeignKey("suppliers.id"), index=True)
    po_reference: Mapped[str] = mapped_column(String(30))
    material_name: Mapped[str] = mapped_column(String(200))
    unit_price_amount: Mapped[float] = mapped_column(Float)
    unit_price_currency: Mapped[str] = mapped_column(String(3), default="INR")
    delivered_on_time: Mapped[bool] = mapped_column(Boolean)
    quality_accepted: Mapped[bool] = mapped_column(Boolean)
    occurred_on: Mapped[date] = mapped_column(Date)

    supplier: Mapped["Supplier"] = relationship(back_populates="transactions")
