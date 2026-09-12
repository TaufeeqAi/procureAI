import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.requisition import Requisition



class ConfidenceBand(enum.StrEnum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class RecommendationState(enum.StrEnum):
    READY = "READY"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class AgentKind(enum.StrEnum):
    """Mirrors frontend/types/ai.ts `AgentKind` — kept in sync with
    backend/app/ai/agents/*.py once Phase 5 introduces the real agents;
    see docs/architecture/ai-interaction-layer.md on the frontend side for
    why this list must not drift between the two."""

    REQUIREMENT_AGENT = "REQUIREMENT_AGENT"
    SUPPLIER_INTELLIGENCE_AGENT = "SUPPLIER_INTELLIGENCE_AGENT"
    COMMUNICATION_AGENT = "COMMUNICATION_AGENT"
    QUOTE_INTELLIGENCE_AGENT = "QUOTE_INTELLIGENCE_AGENT"
    PROCUREMENT_ANALYST = "PROCUREMENT_ANALYST"
    RISK_AGENT = "RISK_AGENT"
    NEGOTIATION_AGENT = "NEGOTIATION_AGENT"


class AgentRunStatus(enum.StrEnum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    ANALYZING = "ANALYZING"
    WAITING_FOR_EXTERNAL_EVENT = "WAITING_FOR_EXTERNAL_EVENT"
    WAITING_FOR_REVIEW = "WAITING_FOR_REVIEW"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class AIRecommendation(Base):
    """
    One recommendation per requisition today (`uselist=False` on the
    Requisition side) — matches the product's current shape, where a PR
    gets re-analyzed in place rather than accumulating a history of
    recommendations. If Phase 6+ needs recommendation history (e.g. to
    show "confidence changed from 88% to 93% after new quote data"), that
    is a schema change here, not a frontend one — the frontend's
    `ProcurementRecommendation` type has no history concept to preserve.
    """

    __tablename__ = "ai_recommendations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    requisition_id: Mapped[str] = mapped_column(ForeignKey("requisitions.id"), unique=True, index=True)
    supplier_id: Mapped[str] = mapped_column(ForeignKey("suppliers.id"))

    confidence: Mapped[float] = mapped_column(Float)
    confidence_band: Mapped[ConfidenceBand] = mapped_column(Enum(ConfidenceBand))
    recommendation_state: Mapped[RecommendationState] = mapped_column(Enum(RecommendationState))
    overall_score: Mapped[float] = mapped_column(Float)

    # ScoreDimension dict, RiskFlag[], EvidenceReference[], PolicyCheck[],
    # alternatives[] — every one a nested-object array with no SQL query
    # into individual sub-fields today; see the JSON-column rationale in
    # models/supplier.py.
    dimensions: Mapped[dict] = mapped_column(JSON)
    reasons: Mapped[list[str]] = mapped_column(JSON, default=list)
    trade_off: Mapped[str | None] = mapped_column(Text, nullable=True)
    risks: Mapped[list[dict]] = mapped_column(JSON, default=list)
    evidence: Mapped[list[dict]] = mapped_column(JSON, default=list)
    policy_checks: Mapped[list[dict]] = mapped_column(JSON, default=list)
    alternatives: Mapped[list[dict]] = mapped_column(JSON, default=list)

    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    requisition: Mapped["Requisition"] = relationship(back_populates="ai_recommendation")


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    requisition_id: Mapped[str] = mapped_column(ForeignKey("requisitions.id"), index=True)

    agent: Mapped[AgentKind] = mapped_column(Enum(AgentKind))
    label: Mapped[str] = mapped_column(String(100))
    status: Mapped[AgentRunStatus] = mapped_column(Enum(AgentRunStatus), default=AgentRunStatus.QUEUED)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    output_href: Mapped[str | None] = mapped_column(String(255), nullable=True)

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    requisition: Mapped["Requisition"] = relationship(back_populates="agent_runs")
