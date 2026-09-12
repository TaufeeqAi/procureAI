import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.communication import CommunicationMessage
    from app.models.requisition import Requisition
    from app.models.supplier import Supplier



class RFQRecipientStatus(enum.StrEnum):
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    OPENED = "OPENED"
    RESPONDED = "RESPONDED"
    PARTIAL = "PARTIAL"
    NO_RESPONSE = "NO_RESPONSE"
    ESCALATED = "ESCALATED"


class MessageSender(enum.StrEnum):
    ELECON = "ELECON"
    SUPPLIER = "SUPPLIER"
    AI_DRAFT = "AI_DRAFT"


class ResponseCompleteness(enum.StrEnum):
    COMPLETE = "COMPLETE"
    PARTIAL = "PARTIAL"
    AWAITING = "AWAITING"


class RFQ(Base):
    __tablename__ = "rfqs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rfq_number: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    requisition_id: Mapped[str] = mapped_column(ForeignKey("requisitions.id"), index=True)
    material_name: Mapped[str] = mapped_column(String(200))
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    requisition: Mapped["Requisition"] = relationship(back_populates="rfqs")
    recipients: Mapped[list["RFQRecipient"]] = relationship(
        back_populates="rfq", cascade="all, delete-orphan", order_by="RFQRecipient.id"
    )


class RFQRecipient(Base):
    """
    One row per (RFQ, supplier) pair. This doubles as the frontend's
    `SupplierResponseThread` grouping key — deliberately, rather than
    introducing a separate "thread" table, since a thread's identity *is*
    exactly "this supplier, responding to this RFQ." Extraction fields and
    completeness live here rather than on a child table for the same
    reason the JSON columns exist elsewhere: nothing queries into
    individual extracted fields via SQL today.
    """

    __tablename__ = "rfq_recipients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rfq_id: Mapped[str] = mapped_column(ForeignKey("rfqs.id"), index=True)
    supplier_id: Mapped[str] = mapped_column(ForeignKey("suppliers.id"), index=True)

    status: Mapped[RFQRecipientStatus] = mapped_column(Enum(RFQRecipientStatus), default=RFQRecipientStatus.SENT)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reminders_sent: Mapped[int] = mapped_column(Integer, default=0)

    extracted_fields: Mapped[list[dict]] = mapped_column(JSON, default=list)
    completeness: Mapped[ResponseCompleteness] = mapped_column(
        Enum(ResponseCompleteness), default=ResponseCompleteness.AWAITING
    )

    rfq: Mapped["RFQ"] = relationship(back_populates="recipients")
    supplier: Mapped["Supplier"] = relationship(back_populates="rfq_recipients")
    messages: Mapped[list["CommunicationMessage"]] = relationship(
        back_populates="recipient", cascade="all, delete-orphan", order_by="CommunicationMessage.sent_at"
    )
