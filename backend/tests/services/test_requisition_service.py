from datetime import UTC, date, datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.requisition import Requisition
from app.services import requisition_service


async def _add_requisition(db_session: AsyncSession, **overrides) -> None:
    defaults = dict(
        id="pr-svc-1",
        pr_number="PR-2026-00500",
        material_name="Service Test Part",
        quantity=10,
        unit="unit",
        drawing_revision_available=True,
        application="Test Application",
        required_date=date(2026, 12, 1),
        requesting_department="Test Dept",
        status="RECEIVED",
        exceptions=[],
        created_at=datetime(2026, 9, 1, tzinfo=UTC),
        updated_at=datetime(2026, 9, 1, tzinfo=UTC),
        has_been_analyzed=False,
    )
    defaults.update(overrides)
    db_session.add(Requisition(**defaults))
    await db_session.commit()


@pytest.mark.asyncio
async def test_requirement_validation_flags_missing_drawing(db_session: AsyncSession):
    """The blocking-requirement rule from docs/architecture/state-
    machines.md, verified at the service layer: a PR without a drawing
    revision must come back with a blocking issue, not silently pass."""
    await _add_requisition(db_session, drawing_revision_available=False)

    result = await requisition_service.get_requirement_validation(db_session, "PR-2026-00500")

    drawing_field = next(f for f in result.fields if f.field == "drawingReference")
    assert drawing_field.status == "MISSING"
    assert result.blocking_issues == ["Drawing revision has not been provided."]


@pytest.mark.asyncio
async def test_requirement_validation_passes_when_drawing_present(db_session: AsyncSession):
    await _add_requisition(db_session, drawing_revision_available=True)

    result = await requisition_service.get_requirement_validation(db_session, "PR-2026-00500")

    drawing_field = next(f for f in result.fields if f.field == "drawingReference")
    assert drawing_field.status == "CONFIRMED"
    assert result.blocking_issues == []


@pytest.mark.asyncio
async def test_workflow_state_marks_current_step_correctly(db_session: AsyncSession):
    """Mirrors lib/mock/queries.ts's buildWorkflowState test coverage on
    the frontend — same status, same expected current-step index."""
    await _add_requisition(db_session, status="RFQ_IN_PROGRESS")

    detail = await requisition_service.get_requisition_detail(db_session, "PR-2026-00500")

    current_steps = [s for s in detail.workflow_state.steps if s.current]
    assert len(current_steps) == 1
    assert current_steps[0].key == "RFQ_IN_PROGRESS"

    completed_keys = [s.key for s in detail.workflow_state.steps if s.completed]
    assert completed_keys == ["RECEIVED", "VALIDATING", "READY_FOR_SOURCING"]

