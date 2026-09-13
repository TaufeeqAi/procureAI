import json
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.errors import (
    AIConfigurationError,
    AIExecutionError,
    AIOutputValidationError,
)
from app.ai.schemas import ProcurementAIRunOut
from app.ai.service import ProcurementAIService
from app.core.database import get_db
from app.core.exceptions import AppError
from app.models.requisition import Requisition

router = APIRouter(
    prefix="/ai",
    tags=["ai"],
)

DbSession = Annotated[
    AsyncSession,
    Depends(get_db),
]


class StreamQuery(BaseModel):
    thread_id: str | None = None


def _sse(
    event_name: str,
    payload: dict,
) -> str:
    body = json.dumps(
        payload,
        ensure_ascii=False,
        separators=(",", ":"),
    )

    return (
        f"event: {event_name}\n"
        f"data: {body}\n\n"
    )


@router.post(
    "/procurement/{pr_number}",
    response_model=ProcurementAIRunOut,
    response_model_by_alias=True,
)
async def run_procurement_ai(
    pr_number: str,
    db: DbSession,
):
    try:
        return await ProcurementAIService().run(
            db,
            pr_number,
        )
    except (
        AIConfigurationError,
        AIExecutionError,
        AIOutputValidationError,
    ) as exc:
        raise AppError(
            str(exc),
            code=getattr(
                exc,
                "code",
                "ai_request_failed",
            ),
        ) from exc


@router.post(
    "/procurement/{pr_number}/stream"
)
async def stream_procurement_ai(
    pr_number: str,
    db: DbSession,
    body: StreamQuery | None = None,
):
    service = ProcurementAIService()

    try:
        service.ensure_configured()
    except AIConfigurationError as exc:
        raise AppError(
            str(exc),
            code="ai_not_configured",
        ) from exc

    if await db.get(
        Requisition,
        pr_number,
    ) is None:
        raise AppError(
            f"No requisition '{pr_number}'.",
            code="not_found",
        )

    async def generator():
        try:
            async for payload in service.stream(
                db,
                pr_number,
                thread_id=(
                    body.thread_id
                    if body
                    else None
                ),
            ):
                yield _sse(
                    payload["type"],
                    payload,
                )
        except Exception as exc:
            error_payload = {
                "type": "run.failed",
                "pr_number": pr_number,
                "data": {
                    "code": getattr(
                        exc,
                        "code",
                        "ai_stream_failed",
                    ),
                    "message": str(exc),
                },
            }

            yield _sse(
                "run.failed",
                error_payload,
            )

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": (
                "no-cache, no-transform"
            ),
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )