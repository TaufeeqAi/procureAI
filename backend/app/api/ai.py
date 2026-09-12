from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.ai import AgentRun
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/activity", response_model=list[AgentRun], response_model_by_alias=True)
async def list_activity(db: DbSession) -> list[AgentRun]:
    """Backs the global AI Activity screen — every agent run across every
    PR. Action-visible, not chain-of-thought — this endpoint returns the
    same AgentRun shape as the per-PR /requisitions/{pr}/agent-runs
    endpoint, never a reasoning trace; see docs/architecture/ai-ux.md."""
    return await ai_service.list_all_agent_runs(db)
