from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


CurrencyCode = Literal[
    "INR",
    "USD",
    "EUR",
]

RiskLevel = Literal[
    "LOW",
    "MEDIUM",
    "HIGH",
]

ConfidenceBand = Literal[
    "HIGH",
    "MEDIUM",
    "LOW",
    "INSUFFICIENT_DATA",
]

Provenance = Literal[
    "FACT",
    "CALCULATED",
    "AI_INTERPRETATION",
    "HUMAN_DECISION",
]

ActorRole = Literal[
    "BUYER",
    "PURCHASE_MANAGER",
    "SUPPLIER",
    "IT_ADMIN",
    "AUDITOR",
]

ActorType = Literal[
    "HUMAN",
    "AI_AGENT",
]

NotificationSeverity = Literal[
    "ACTION_REQUIRED",
    "WARNING",
    "RISK",
    "FINANCIAL",
    "SYSTEM",
    "INFORMATION",
]


class CamelModel(BaseModel):
    """
    Every schema in this API inherits from this, not from plain
    `BaseModel`. It's the one piece of machinery behind the "critical
    rule" from the master plan — `mock.getPR()` → `api.getPR()` without
    the frontend's page components changing their conceptual model —
    since the frontend's TypeScript types are camelCase and Python
    convention is snake_case.

    - `alias_generator=to_camel` means the JSON on the wire uses
      `prNumber`, `requiredDate`, etc. — identical to the TypeScript
      field names — while Python code throughout this backend still
      reads and writes `pr_number`, `required_date`.
    - `populate_by_name=True` lets Python code (services, tests, the seed
      script) construct these models with snake_case keyword arguments
      too, rather than being forced to use the wire alias internally.
    - `from_attributes=True` lets a schema be built directly from a
      SQLAlchemy ORM object (`Requisition.model_validate(orm_instance)`),
      which is how every service function in app/services/ returns data.

    FastAPI serializes response models using aliases by default
    (`response_model_by_alias=True` is the framework default), so no
    per-route configuration is needed for the camelCase JSON to appear —
    but routes set it explicitly anyway; see app/api/deps.py.
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class Money(CamelModel):
    """Mirrors frontend/types/common.ts `Money` exactly. Every response
    schema below uses this — never a bare float — for the same reason the
    frontend never uses one: an amount without its currency is a bug
    waiting to be a display bug."""

    currency: CurrencyCode
    amount: float


class Actor(CamelModel):
    id: str
    name: str
    role: ActorRole
    supplier_id: str | None = None


class AgentActor(CamelModel):
    type: ActorType
    id: str
    display_name: str
    model_version: str | None = None


class EvidenceItem(CamelModel):
    """Internal authoritative evidence-catalog item.

    This represents an evidence object created by the application
    before it reaches the AI layer.

    It is deliberately different from EvidenceReference:

    EvidenceItem
        = authoritative catalog object used by AI validation

    EvidenceReference
        = public reference returned inside AI-facing API contracts
    """

    id: str
    label: str
    value: str
    source_type: str
    source_ref: str


class EvidenceReference(CamelModel):
    """Every AI interpretation traces to at least one of these — see
    docs/architecture/design-system.md's Fact/Calculated/AI/Human
    separation on the frontend, which this schema exists to make
    enforceable end to end, not just a frontend convention."""

    id: str
    type: Literal["PURCHASE_ORDER", "TRANSACTION", "QUOTE", "DELIVERY", "QUALITY_EVENT", "DOCUMENT"]
    label: str
    href: str | None = None
    as_of: datetime


class RiskFlag(CamelModel):
    severity: RiskLevel
    message: str
    evidence: list[EvidenceReference] | None = None


class AuditEvent(CamelModel):
    id: str
    entity_type: str
    entity_id: str
    action: str
    actor: AgentActor
    occurred_at: datetime
    metadata: dict | None = None


class NotificationEvent(CamelModel):
    id: str
    severity: NotificationSeverity
    title: str
    message: str
    entity_href: str | None = None
    created_at: datetime
    read: bool