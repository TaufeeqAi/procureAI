from datetime import date, datetime
from typing import Literal

from app.schemas.common import CamelModel, Money

PRStatus = Literal[
    "RECEIVED", "VALIDATING", "READY_FOR_SOURCING", "RFQ_IN_PROGRESS", "RESPONSES_RECEIVED",
    "ANALYSIS_READY", "AWAITING_APPROVAL", "APPROVED", "PO_CREATED", "FULFILLMENT", "COMPLETED",
]
PRException = Literal[
    "VALIDATION_FAILED", "NO_SUPPLIER_RESPONSE", "QUOTE_INVALID", "DELIVERY_RISK",
    "APPROVAL_REJECTED", "EXTERNAL_SYSTEM_FAILURE",
]


class MaterialRequirement(CamelModel):
    material_name: str
    part_code: str | None = None
    quantity: int
    unit: str
    application: str | None = None
    drawing_reference: str | None = None
    drawing_revision_available: bool


class Requisition(CamelModel):
    """Mirrors frontend/types/procurement.ts `PurchaseRequisition`. Field
    naming here is snake_case (Python convention) while the JSON on the
    wire is camelCase, matching the TypeScript type exactly — see
    `CamelModel` in app/schemas/common.py for how."""

    id: str
    pr_number: str
    material: MaterialRequirement
    required_date: date
    requesting_department: str
    status: PRStatus
    exceptions: list[PRException]
    estimated_value: Money | None = None
    created_at: datetime
    updated_at: datetime
    has_been_analyzed: bool


class RequirementValidationField(CamelModel):
    field: str
    label: str
    status: Literal["CONFIRMED", "INFERRED", "MISSING"]
    confidence: float | None = None


class RequirementValidation(CamelModel):
    pr_id: str
    fields: list[RequirementValidationField]
    blocking_issues: list[str]
    evaluated_at: datetime


ProcurementTaskPriority = Literal["HIGH", "MEDIUM", "READY"]


class ProcurementTask(CamelModel):
    id: str
    pr_id: str
    pr_number: str
    material_name: str
    priority: ProcurementTaskPriority
    headline: str
    detail: str
    action_label: str
    action_href: str


class ProcurementDashboardSummary(CamelModel):
    open_prs: int
    recommendations_ready: int
    pending_approvals: int
    exceptions: int


class ProcurementAiOpportunities(CamelModel):
    estimated_savings: Money | None = None
    negotiation_count: int
    price_anomalies: int
    delivery_risks: int
    quality_risks: int


class ActivityEvent(CamelModel):
    id: str
    message: str
    occurred_at: datetime
    entity_href: str | None = None


class AIStandingBriefPill(CamelModel):
    label: str
    tone: Literal["success", "danger", "warning", "ai"]


class AIStandingBrief(CamelModel):
    paragraphs: list[str]
    status_pills: list[AIStandingBriefPill]
    generated_at: datetime


class ProcurementDashboardData(CamelModel):
    """Data contract for GET /dashboard — matches
    frontend/types/procurement.ts `ProcurementDashboardData` exactly."""

    summary: ProcurementDashboardSummary
    decision_queue: list[ProcurementTask]
    ai_opportunities: ProcurementAiOpportunities
    recent_activity: list[ActivityEvent]
    standing_brief: AIStandingBrief


class NavCounts(CamelModel):
    pr_queue: int
    awaiting_supplier: int
    awaiting_decision: int
    exceptions: int
    supplier_inbox: int


class SourcingState(CamelModel):
    eligible_supplier_count: int
    contacted_supplier_count: int
    responded_supplier_count: int
    comparable_historical_purchases: int


class SupplierSummaryHighlight(CamelModel):
    label: Literal["BEST_PRICE", "BEST_DELIVERY", "BEST_OVERALL"]
    supplier_id: str
    supplier_name: str
    value: str


class SupplierSummary(CamelModel):
    highlights: list[SupplierSummaryHighlight]


class WorkflowStep(CamelModel):
    key: PRStatus
    label: str
    completed: bool
    current: bool


class WorkflowState(CamelModel):
    steps: list[WorkflowStep]


class PRDetailData(CamelModel):
    """Data contract for GET /requisitions/{pr_number} — matches
    frontend/types/procurement.ts `PRDetailData` exactly."""

    requisition: Requisition
    requirement_validation: RequirementValidation
    sourcing_state: SourcingState
    supplier_summary: SupplierSummary
    workflow_state: WorkflowState


class PRTimelineEntry(CamelModel):
    id: str
    label: str
    description: str | None = None
    actor: dict | None = None
    occurred_at: datetime
    risk_flag: str | None = None
    evidence: list[dict] | None = None


class PRTimelineData(CamelModel):
    pr_id: str
    entries: list[PRTimelineEntry]
