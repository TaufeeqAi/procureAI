from datetime import date, datetime
from typing import Literal

from app.schemas.common import CamelModel, RiskLevel

DeliveryStatus = Literal["EXPECTED", "AT_RISK", "DISPATCHED", "PARTIAL", "RECEIVED"]
DeliveryTimelineKey = Literal["PO_APPROVED", "PO_SENT", "ACKNOWLEDGED", "DISPATCHED", "DELIVERED"]


class DeliveryTimelineStep(CamelModel):
    key: DeliveryTimelineKey
    label: str
    completed: bool


class DeliveryExceptionSchema(CamelModel):
    id: str
    severity: RiskLevel
    message: str
    detected_at: datetime
    suggested_action_label: str | None = None


class Delivery(CamelModel):
    id: str
    po_id: str
    po_number: str
    supplier_id: str
    supplier_name: str
    material_name: str
    expected_date: date
    quantity_ordered: int
    quantity_received: int
    status: DeliveryStatus
    risk_level: RiskLevel
    timeline: list[DeliveryTimelineStep]
    exceptions: list[DeliveryExceptionSchema]
    last_supplier_communication_at: datetime | None = None
