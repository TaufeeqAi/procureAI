from datetime import date

from fastapi import APIRouter, Query

from app.api.deps import DbSession
from app.calculations.what_if import WhatIfWeights
from app.schemas.intelligence import ProcurementTruth, WhatIfResponse
from app.services import intelligence_service

router = APIRouter(prefix="/requisitions", tags=["intelligence"])


@router.get("/{pr_number}/intelligence", response_model=ProcurementTruth, response_model_by_alias=True)
async def get_procurement_intelligence(pr_number: str, db: DbSession) -> ProcurementTruth:
    return await intelligence_service.build_procurement_truth(db, pr_number)


@router.get("/{pr_number}/what-if", response_model=WhatIfResponse, response_model_by_alias=True)
async def get_what_if(
    pr_number: str,
    db: DbSession,
    required_date: date | None = Query(default=None),
    quantity: int | None = Query(default=None, gt=0),
    price: float = Query(default=0.30, ge=0),
    quality: float = Query(default=0.25, ge=0),
    delivery: float = Query(default=0.25, ge=0),
    commercial: float = Query(default=0.20, ge=0),
    risk: float = Query(default=0.00, ge=0),
) -> WhatIfResponse:
    pr = await intelligence_service._load_pr(db, pr_number)
    return await intelligence_service.build_what_if(
        db,
        pr_number,
        required_date=required_date or pr.required_date,
        quantity=quantity or pr.quantity,
        weights=WhatIfWeights(price=price, quality=quality, delivery=delivery, commercial=commercial, risk=risk),
    )
