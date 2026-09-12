from datetime import date, datetime
from typing import Literal

from app.schemas.common import CamelModel, Money
from app.schemas.quote import LandedCostBreakdown

POStatus = Literal[
    "DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT", "ACKNOWLEDGED",
    "DISPATCHED", "PARTIALLY_RECEIVED", "RECEIVED", "CLOSED",
]


class POLineItem(CamelModel):
    material_name: str
    quantity: int
    unit_price: Money
    line_value: Money
    expected_delivery: date


class POValidationCheck(CamelModel):
    label: str
    passed: bool


class PurchaseOrder(CamelModel):
    id: str
    po_number: str
    pr_id: str
    pr_number: str
    supplier_id: str
    supplier_name: str
    status: POStatus
    line_items: list[POLineItem]
    cost_breakdown: LandedCostBreakdown
    payment_terms_days: int
    validation_checks: list[POValidationCheck]
    created_at: datetime
    sent_at: datetime | None = None
    acknowledged_at: datetime | None = None


class POListItem(CamelModel):
    id: str
    po_number: str
    supplier_name: str
    value: Money
    expected_delivery: date
    status: POStatus
