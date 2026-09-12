import enum
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.supplier import RiskLevel

if TYPE_CHECKING:
    from app.models.purchase_order import PurchaseOrder



class DeliveryStatus(enum.StrEnum):
    EXPECTED = "EXPECTED"
    AT_RISK = "AT_RISK"
    DISPATCHED = "DISPATCHED"
    PARTIAL = "PARTIAL"
    RECEIVED = "RECEIVED"


class DeliveryTimelineKey(enum.StrEnum):
    PO_APPROVED = "PO_APPROVED"
    PO_SENT = "PO_SENT"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    DISPATCHED = "DISPATCHED"
    DELIVERED = "DELIVERED"


class Delivery(Base):
    __tablename__ = "deliveries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    purchase_order_id: Mapped[str] = mapped_column(ForeignKey("purchase_orders.id"), unique=True, index=True)

    expected_date: Mapped[date] = mapped_column(Date)
    quantity_ordered: Mapped[int] = mapped_column(Integer)
    quantity_received: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[DeliveryStatus] = mapped_column(Enum(DeliveryStatus), default=DeliveryStatus.EXPECTED, index=True)
    risk_level: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel), default=RiskLevel.LOW)
    last_supplier_communication_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    purchase_order: Mapped["PurchaseOrder"] = relationship(back_populates="delivery")
    timeline: Mapped[list["DeliveryTimelineStep"]] = relationship(
        back_populates="delivery", cascade="all, delete-orphan", order_by="DeliveryTimelineStep.sequence"
    )
    exceptions: Mapped[list["DeliveryException"]] = relationship(
        back_populates="delivery", cascade="all, delete-orphan"
    )


class DeliveryTimelineStep(Base):
    __tablename__ = "delivery_timeline_steps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    delivery_id: Mapped[str] = mapped_column(ForeignKey("deliveries.id"), index=True)
    key: Mapped[DeliveryTimelineKey] = mapped_column(Enum(DeliveryTimelineKey))
    label: Mapped[str] = mapped_column(String(50))
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    sequence: Mapped[int] = mapped_column(Integer)

    delivery: Mapped["Delivery"] = relationship(back_populates="timeline")


class DeliveryException(Base):
    __tablename__ = "delivery_exceptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    delivery_id: Mapped[str] = mapped_column(ForeignKey("deliveries.id"), index=True)
    severity: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel))
    message: Mapped[str] = mapped_column(Text)
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    suggested_action_label: Mapped[str | None] = mapped_column(String(100), nullable=True)

    delivery: Mapped["Delivery"] = relationship(back_populates="exceptions")
