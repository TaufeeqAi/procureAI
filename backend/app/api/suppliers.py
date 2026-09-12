from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.supplier import Supplier, SupplierDetailData
from app.services import supplier_service

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.get("", response_model=list[Supplier], response_model_by_alias=True)
async def list_suppliers(db: DbSession) -> list[Supplier]:
    return await supplier_service.list_suppliers(db)


@router.get("/{code}", response_model=SupplierDetailData, response_model_by_alias=True)
async def get_supplier_detail(code: str, db: DbSession) -> SupplierDetailData:
    return await supplier_service.get_supplier_detail(db, code)
