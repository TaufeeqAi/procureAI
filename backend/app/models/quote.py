import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.requisition import Requisition
    from app.models.supplier import Supplier



class QuoteValidationStatus(enum.StrEnum):
    VALID = "VALID"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    INVALID = "INVALID"


class Quote(Base):
    __tablename__ = "quotes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quote_reference: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    requisition_id: Mapped[str] = mapped_column(ForeignKey("requisitions.id"), index=True)
    supplier_id: Mapped[str] = mapped_column(ForeignKey("suppliers.id"), index=True)

    source_document_name: Mapped[str] = mapped_column(String(255))
    unit_price_amount: Mapped[float] = mapped_column(Float)
    unit_price_currency: Mapped[str] = mapped_column(String(3), default="INR")
    quantity: Mapped[int] = mapped_column(Integer)
    freight_amount: Mapped[float] = mapped_column(Float)
    freight_currency: Mapped[str] = mapped_column(String(3), default="INR")
    tax_rate_percent: Mapped[float] = mapped_column(Float)
    lead_time_days: Mapped[int] = mapped_column(Integer)
    payment_terms_days: Mapped[int] = mapped_column(Integer)
    validity_days: Mapped[int] = mapped_column(Integer)

    # ExtractedQuoteField[] and QuoteFieldConflict[] — see the JSON-column
    # rationale in models/supplier.py.
    extracted_fields: Mapped[list[dict]] = mapped_column(JSON, default=list)
    conflicts: Mapped[list[dict]] = mapped_column(JSON, default=list)

    validation_status: Mapped[QuoteValidationStatus] = mapped_column(
        Enum(QuoteValidationStatus), default=QuoteValidationStatus.NEEDS_REVIEW
    )
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    # Landed cost is deliberately NOT stored here — it is always computed
    # on read by app/calculations/pricing.py from the fields above, the
    # same rule the frontend enforces with lib/utils/pricing.ts. Storing a
    # derived total invites the exact drift bug documented in
    # docs/architecture/roadmap.md's project history.

    requisition: Mapped["Requisition"] = relationship(back_populates="quotes")
    supplier: Mapped["Supplier"] = relationship(back_populates="quotes")
