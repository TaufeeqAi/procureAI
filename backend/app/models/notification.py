import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class NotificationSeverity(enum.StrEnum):
    ACTION_REQUIRED = "ACTION_REQUIRED"
    WARNING = "WARNING"
    RISK = "RISK"
    FINANCIAL = "FINANCIAL"
    SYSTEM = "SYSTEM"
    INFORMATION = "INFORMATION"


class Notification(Base):
    """
    Not in the master plan's original models/ list — added because the
    frontend's Notification Center (Phase 1) needs a real backing table,
    and there was no more natural home for it than its own model. Same
    class of addition as `qualityRisks` on the frontend's
    ProcurementAiOpportunities type: a reasonable extension flagged
    explicitly rather than silently bolted on elsewhere.
    """

    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    severity: Mapped[NotificationSeverity] = mapped_column(Enum(NotificationSeverity))
    title: Mapped[str] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(Text)
    entity_href: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
