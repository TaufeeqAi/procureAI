from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification as NotificationModel
from app.schemas.common import NotificationEvent


async def list_notifications(db: AsyncSession) -> list[NotificationEvent]:
    result = await db.execute(select(NotificationModel).order_by(NotificationModel.created_at.desc()))
    return [NotificationEvent.model_validate(n) for n in result.scalars().all()]


async def count_unread(db: AsyncSession) -> int:
    """Backs the header's notification badge — a dedicated count query
    rather than `len(await list_notifications(db))` so the frontend's
    AppShell doesn't need to fetch every notification body just to render
    a badge number."""
    result = await db.execute(select(NotificationModel).where(NotificationModel.read.is_(False)))
    return len(result.scalars().all())
