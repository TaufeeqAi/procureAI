from fastapi import APIRouter

from app.api.deps import DbSession
from app.core.exceptions import NotFoundError
from app.schemas.ai import AgentRun, ProcurementRecommendation
from app.schemas.quote import QuoteComparisonData
from app.services import quote_service

router = APIRouter(prefix="/requisitions", tags=["recommendations"])


@router.get("/{pr_number}/quotes", response_model=QuoteComparisonData, response_model_by_alias=True)
async def get_quote_comparison(pr_number: str, db: DbSession) -> QuoteComparisonData:
    comparison = await quote_service.get_quote_comparison(db, pr_number)
    if comparison is None:
        raise NotFoundError(f"No quotes yet for {pr_number}", code="no_quotes")
    return comparison


@router.get("/{pr_number}/decision", response_model=ProcurementRecommendation, response_model_by_alias=True)
async def get_recommendation(pr_number: str, db: DbSession) -> ProcurementRecommendation:
    from app.services import ai_service

    recommendation = await ai_service.get_recommendation(db, pr_number)
    if recommendation is None:
        raise NotFoundError(f"No recommendation yet for {pr_number}", code="no_recommendation")
    return recommendation


@router.get("/{pr_number}/agent-runs", response_model=list[AgentRun], response_model_by_alias=True)
async def get_agent_runs(pr_number: str, db: DbSession) -> list[AgentRun]:
    from app.services import ai_service

    return await ai_service.get_agent_runs(db, pr_number)
