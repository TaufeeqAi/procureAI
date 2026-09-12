import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.rfq import MessageSender

if TYPE_CHECKING:
    from app.models.rfq import RFQRecipient



class CommunicationMessage(Base):
    __tablename__ = "communication_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recipient_id: Mapped[str] = mapped_column(ForeignKey("rfq_recipients.id"), index=True)

    sender: Mapped[MessageSender] = mapped_column(Enum(MessageSender))
    body: Mapped[str] = mapped_column(Text)
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    # True only for an unsent AI_DRAFT message — see
    # docs/architecture/ai-ux.md: an AI-authored outbound message always
    # needs an explicit human send step, and this flag is what a future
    # "send" endpoint checks before a draft is allowed to become a real
    # sent message.
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=False)

    recipient: Mapped["RFQRecipient"] = relationship(back_populates="messages")
