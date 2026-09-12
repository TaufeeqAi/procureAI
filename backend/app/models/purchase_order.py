import enum
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Date, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.delivery import Delivery
    from app.models.requisition import Requisition
    from app.models.supplier import Supplier



class POStatus(enum.StrEnum):
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    SENT = "SENT"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    DISPATCHED = "DISPATCHED"
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED"
    RECEIVED = "RECEIVED"
    CLOSED = "CLOSED"


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    po_number: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    requisition_id: Mapped[str] = mapped_column(ForeignKey("requisitions.id"), index=True)
    supplier_id: Mapped[str] = mapped_column(ForeignKey("suppliers.id"), index=True)

    status: Mapped[POStatus] = mapped_column(Enum(POStatus), default=POStatus.DRAFT, index=True)
    payment_terms_days: Mapped[int] = mapped_column(Integer)

    # The cost breakdown IS persisted here, unlike Quote's landed cost —
    # the difference is deliberate. A quote's price can still change (a
    # supplier revises it); a PO's cost is the number a purchase was
    # actually placed against and must stay fixed even if
    # `calculations/pricing.py`'s formula or the underlying quote later
    # changes. See docs/architecture/backend-contract-parity.md.
    subtotal_amount: Mapped[float] = mapped_column(Float)
    freight_amount: Mapped[float] = mapped_column(Float)
    tax_rate_percent: Mapped[float] = mapped_column(Float)
    tax_amount: Mapped[float] = mapped_column(Float)
    total_amount: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(3), default="INR")

    validation_checks: Mapped[list[dict]] = mapped_column(JSON, default=list)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    requisition: Mapped["Requisition"] = relationship(back_populates="purchase_orders")
    supplier: Mapped["Supplier"] = relationship(back_populates="purchase_orders")
    line_items: Mapped[list["POLineItem"]] = relationship(back_populates="purchase_order", cascade="all, delete-orphan")
    delivery: Mapped["Delivery | None"] = relationship(
        back_populates="purchase_order", uselist=False, cascade="all, delete-orphan"
    )


class POLineItem(Base):
    __tablename__ = "po_line_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    purchase_order_id: Mapped[str] = mapped_column(ForeignKey("purchase_orders.id"), index=True)

    material_name: Mapped[str] = mapped_column(String(200))
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price_amount: Mapped[float] = mapped_column(Float)
    unit_price_currency: Mapped[str] = mapped_column(String(3), default="INR")
    line_value_amount: Mapped[float] = mapped_column(Float)
    expected_delivery: Mapped[date] = mapped_column(Date)

    purchase_order: Mapped["PurchaseOrder"] = relationship(back_populates="line_items")
