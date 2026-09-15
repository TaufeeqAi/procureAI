from __future__ import annotations

import json
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.errors import (
    AIConfigurationError,
    AIExecutionError,
    AIOutputValidationError,
)
from app.ai.schemas import AIQuestionRequest, AIQuestionResponse, ProcurementAIRunOut
from app.ai.service import ProcurementAIService
from app.core.database import get_db
from app.core.exceptions import AppError
from app.models.ai_recommendation import AIRecommendation
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

    # ✅ FIX: Query by pr_number, NOT by primary key (id)
    requisition_check = await db.execute(
        select(Requisition).where(Requisition.pr_number == pr_number)
    )
    if requisition_check.scalar_one_or_none() is None:
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


@router.post(
    "/procurement/{pr_number}/ask",
    response_model=AIQuestionResponse,
    response_model_by_alias=True,
)
async def ask_procurement_ai(
    pr_number: str,
    body: AIQuestionRequest,
    db: DbSession,
):
    service = ProcurementAIService()
    try:
        return await service.ask(
            db,
            pr_number,
            body.question,
            thread_id=body.thread_id,
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


@router.get("/activity")
async def get_ai_activity(
    db: DbSession,
    limit: int = 50,
    days: int = 30,
):
    """Get recent AI agent activity across all PRs."""
    cutoff_date = datetime.now() - timedelta(days=days)
    
    # ✅ FIX: Use joinedload to eagerly fetch the requisition relationship 
    # in the same query, preventing async lazy-loading (MissingGreenlet) errors.
    stmt = (
        select(AIRecommendation)
        .options(joinedload(AIRecommendation.requisition))
        .where(AIRecommendation.generated_at >= cutoff_date)
        .order_by(desc(AIRecommendation.generated_at))
        .limit(limit)
    )
    
    result = await db.execute(stmt)
    # .unique() is required when using joinedload to deduplicate the primary entity
    recommendations = result.scalars().unique().all()
    
    activities = []
    for rec in recommendations:
        pr_number = rec.requisition.pr_number if rec.requisition else "Unknown"
        activities.append({
            "id": rec.id,
            "pr_number": pr_number,
            "agent": "procurement_analyst",
            "label": "Procurement Analyst",
            "status": "complete",
            # ✅ FIX: Use valid columns (overall_score, confidence) instead of non-existent 'recommendation'
            "detail": f"Recommendation generated for {pr_number}. Overall score: {rec.overall_score:.1f}, Confidence: {rec.confidence*100:.0f}%.",
            "timestamp": rec.generated_at.isoformat() if rec.generated_at else datetime.now().isoformat(),
        })
    
    return {"activities": activities, "total": len(activities)}