from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.quote import Quote
from app.services import quote_service

router = APIRouter(prefix="/quotes", tags=["quotes"])


@router.get("", response_model=list[Quote], response_model_by_alias=True)
async def list_quotes(db: DbSession) -> list[Quote]:
    return await quote_service.list_quotes(db)


@router.get("/{quote_reference}", response_model=Quote, response_model_by_alias=True)
async def get_quote_detail(quote_reference: str, db: DbSession) -> Quote:
    return await quote_service.get_quote_detail(db, quote_reference)
