from datetime import datetime
from typing import Literal

from app.schemas.common import CamelModel

RFQRecipientStatus = Literal["SENT", "DELIVERED", "OPENED", "RESPONDED", "PARTIAL", "NO_RESPONSE", "ESCALATED"]
MessageSender = Literal["ELECON", "SUPPLIER", "AI_DRAFT"]
ExtractedFieldStatus = Literal["MATCHED", "CONFLICT", "MISSING"]
ResponseCompleteness = Literal["COMPLETE", "PARTIAL", "AWAITING"]


class RFQRecipient(CamelModel):
    supplier_id: str
    supplier_name: str
    status: RFQRecipientStatus
    sent_at: datetime | None = None
    responded_at: datetime | None = None
    reminders_sent: int


class RFQ(CamelModel):
    id: str
    rfq_number: str
    pr_id: str
    pr_number: str
    material_name: str
    due_date: datetime
    recipients: list[RFQRecipient]
    created_at: datetime


class CommunicationMessage(CamelModel):
    id: str
    sender: MessageSender
    body: str
    sent_at: datetime
    requires_approval: bool | None = None


class ExtractedResponseField(CamelModel):
    field: Literal["quantity", "unitPrice", "deliveryDate", "paymentTerms", "freightTerms"]
    label: str
    value: str
    status: ExtractedFieldStatus


class SupplierResponseThread(CamelModel):
    """Mirrors frontend/types/rfq.ts `SupplierResponseThread`. Backed by
    one `RFQRecipient` row (see app/models/rfq.py's docstring on why the
    recipient row doubles as the thread key)."""

    supplier_id: str
    supplier_name: str
    rfq_id: str
    messages: list[CommunicationMessage]
    extracted_fields: list[ExtractedResponseField]
    completeness: ResponseCompleteness
