from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.rfq import SupplierResponseThread
from app.services import rfq_service

router = APIRouter(prefix="/requisitions", tags=["communications"])


@router.get("/{pr_number}/communication", response_model=list[SupplierResponseThread], response_model_by_alias=True)
async def get_threads(pr_number: str, db: DbSession) -> list[SupplierResponseThread]:
    """Kept as its own router file (per the master plan's file layout)
    even though it shares the /requisitions prefix with requisitions.py —
    communication threads are a distinct enough concern (RFQ/messaging,
    not PR lifecycle) to warrant their own module, matching
    app/services/rfq_service.py owning this logic rather than
    requisition_service.py."""
    return await rfq_service.get_threads_for_pr(db, pr_number)
