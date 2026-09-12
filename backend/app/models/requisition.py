import enum
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, Date, DateTime, Enum, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.ai_recommendation import AgentRun, AIRecommendation
    from app.models.purchase_order import PurchaseOrder
    from app.models.quote import Quote
    from app.models.rfq import RFQ



class PRStatus(enum.StrEnum):
    """Mirrors frontend/types/procurement.ts `PRStatus` exactly, including
    order — docs/architecture/state-machines.md's PR lifecycle diagram is
    the source of truth both sides implement against."""

    RECEIVED = "RECEIVED"
    VALIDATING = "VALIDATING"
    READY_FOR_SOURCING = "READY_FOR_SOURCING"
    RFQ_IN_PROGRESS = "RFQ_IN_PROGRESS"
    RESPONSES_RECEIVED = "RESPONSES_RECEIVED"
    ANALYSIS_READY = "ANALYSIS_READY"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    APPROVED = "APPROVED"
    PO_CREATED = "PO_CREATED"
    FULFILLMENT = "FULFILLMENT"
    COMPLETED = "COMPLETED"


class PRException(enum.StrEnum):
    VALIDATION_FAILED = "VALIDATION_FAILED"
    NO_SUPPLIER_RESPONSE = "NO_SUPPLIER_RESPONSE"
    QUOTE_INVALID = "QUOTE_INVALID"
    DELIVERY_RISK = "DELIVERY_RISK"
    APPROVAL_REJECTED = "APPROVAL_REJECTED"
    EXTERNAL_SYSTEM_FAILURE = "EXTERNAL_SYSTEM_FAILURE"


class Requisition(Base):
    __tablename__ = "requisitions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pr_number: Mapped[str] = mapped_column(String(30), unique=True, index=True)

    # MaterialRequirement, flattened — one PR has exactly one requirement
    # in this product's model (no multi-line PRs yet), so a child table
    # would be a join with no query behind it.
    material_name: Mapped[str] = mapped_column(String(200))
    part_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer)
    unit: Mapped[str] = mapped_column(String(20), default="unit")
    application: Mapped[str | None] = mapped_column(String(200), nullable=True)
    drawing_reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    drawing_revision_available: Mapped[bool] = mapped_column(Boolean, default=False)

    required_date: Mapped[date] = mapped_column(Date)
    requesting_department: Mapped[str] = mapped_column(String(200))
    status: Mapped[PRStatus] = mapped_column(Enum(PRStatus), default=PRStatus.RECEIVED, index=True)

    # list[PRException] — see the JSON-column rationale in supplier.py;
    # the same reasoning applies here (nothing queries "all PRs with
    # exception X" via SQL yet).
    exceptions: Mapped[list[str]] = mapped_column(JSON, default=list)

    estimated_value_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_value_currency: Mapped[str | None] = mapped_column(String(3), nullable=True)

    has_been_analyzed: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    rfqs: Mapped[list["RFQ"]] = relationship(back_populates="requisition", cascade="all, delete-orphan")
    quotes: Mapped[list["Quote"]] = relationship(back_populates="requisition", cascade="all, delete-orphan")
    purchase_orders: Mapped[list["PurchaseOrder"]] = relationship(back_populates="requisition")
    ai_recommendation: Mapped["AIRecommendation | None"] = relationship(
        back_populates="requisition", uselist=False, cascade="all, delete-orphan"
    )
    agent_runs: Mapped[list["AgentRun"]] = relationship(back_populates="requisition", cascade="all, delete-orphan")
