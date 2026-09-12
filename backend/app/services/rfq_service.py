from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models.requisition import Requisition
from app.models.rfq import RFQ as RFQModel
from app.models.rfq import RFQRecipient as RFQRecipientModel
from app.schemas.rfq import RFQ, CommunicationMessage, RFQRecipient, SupplierResponseThread


def _to_schema(rfq: RFQModel, pr_number: str) -> RFQ:
    return RFQ(
        id=rfq.id,
        rfq_number=rfq.rfq_number,
        pr_id=rfq.requisition_id,
        pr_number=pr_number,
        material_name=rfq.material_name,
        due_date=rfq.due_date,
        recipients=[
            RFQRecipient(
                supplier_id=r.supplier_id,
                supplier_name=r.supplier.name,
                status=r.status,
                sent_at=r.sent_at,
                responded_at=r.responded_at,
                reminders_sent=r.reminders_sent,
            )
            for r in rfq.recipients
        ],
        created_at=rfq.created_at,
    )


async def list_rfqs(db: AsyncSession) -> list[RFQ]:
    result = await db.execute(
        select(RFQModel)
        .options(
            selectinload(RFQModel.recipients).selectinload(RFQRecipientModel.supplier),
            selectinload(RFQModel.requisition),
        )
    )
    return [_to_schema(rfq, rfq.requisition.pr_number) for rfq in result.scalars().all()]


async def get_rfq_detail(db: AsyncSession, rfq_number: str) -> RFQ:
    result = await db.execute(
        select(RFQModel)
        .where(RFQModel.rfq_number == rfq_number)
        .options(
            selectinload(RFQModel.recipients).selectinload(RFQRecipientModel.supplier),
            selectinload(RFQModel.requisition),
        )
    )
    rfq = result.scalar_one_or_none()
    if rfq is None:
        raise NotFoundError(f"RFQ {rfq_number} not found", code="rfq_not_found")
    return _to_schema(rfq, rfq.requisition.pr_number)


async def get_threads_for_pr(db: AsyncSession, pr_number: str) -> list[SupplierResponseThread]:
    """Backs both the PR workspace's Communication tab and /rfqs?view=inbox
    — one query, two frontend surfaces, per docs/architecture/information-
    architecture.md's rule against duplicating a dataset per screen."""
    pr_result = await db.execute(select(Requisition).where(Requisition.pr_number == pr_number))
    pr = pr_result.scalar_one_or_none()
    if pr is None:
        raise NotFoundError(f"Requisition {pr_number} not found", code="requisition_not_found")

    rfq_result = await db.execute(
        select(RFQModel)
        .where(RFQModel.requisition_id == pr.id)
        .options(
            selectinload(RFQModel.recipients).selectinload(RFQRecipientModel.supplier),
            selectinload(RFQModel.recipients).selectinload(RFQRecipientModel.messages),
        )
    )
    rfqs = rfq_result.scalars().all()

    threads = []
    for rfq in rfqs:
        for recipient in rfq.recipients:
            threads.append(
                SupplierResponseThread(
                    supplier_id=recipient.supplier_id,
                    supplier_name=recipient.supplier.name,
                    rfq_id=rfq.id,
                    messages=[
                        CommunicationMessage(
                            id=m.id,
                            sender=m.sender,
                            body=m.body,
                            sent_at=m.sent_at,
                            requires_approval=m.requires_approval,
                        )
                        for m in recipient.messages
                    ],
                    extracted_fields=recipient.extracted_fields,
                    completeness=recipient.completeness,
                )
            )
    return threads


async def count_responded_recipients(db: AsyncSession) -> int:
    """Backs NavCounts.supplierInbox — supplier responses sitting in the
    inbox, not yet a completed decision. A dedicated small query rather
    than reusing an unrelated count, even though both happen to be
    integers a badge could display."""
    from app.models.rfq import RFQRecipient as _Recipient

    result = await db.execute(select(_Recipient).where(_Recipient.status == "RESPONDED"))
    return len(result.scalars().all())
