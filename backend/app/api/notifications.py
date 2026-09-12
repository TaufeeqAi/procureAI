from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.common import NotificationEvent
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationEvent], response_model_by_alias=True)
async def list_notifications(db: DbSession) -> list[NotificationEvent]:
    return await notification_service.list_notifications(db)
