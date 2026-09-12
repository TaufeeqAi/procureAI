from datetime import UTC, date, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.requisition import Requisition


async def _seed_one_requisition(db_session: AsyncSession) -> None:
    db_session.add(
        Requisition(
            id="pr-test-1",
            pr_number="PR-2026-00999",
            material_name="Test Bearing",
            part_code="TB-0001",
            quantity=50,
            unit="unit",
            drawing_revision_available=True,
            required_date=date(2026, 12, 1),
            requesting_department="Test Department",
            status="ANALYSIS_READY",
            exceptions=[],
            estimated_value_amount=99000,
            estimated_value_currency="INR",
            created_at=datetime(2026, 9, 1, tzinfo=UTC),
            updated_at=datetime(2026, 9, 1, tzinfo=UTC),
            has_been_analyzed=True,
        )
    )
    await db_session.commit()


@pytest.mark.asyncio
async def test_list_requisitions_returns_camel_case_json(client: AsyncClient, db_session: AsyncSession):
    """
    Proves the CamelModel contract end to end through a real HTTP
    request/response cycle, not just at the schema-unit level — this is
    the actual "critical rule" from the master plan (`mock.getPR()` →
    `api.getPR()` with no frontend shape change) being verified, not just
    asserted in a docstring.
    """
    await _seed_one_requisition(db_session)

    response = await client.get("/api/v1/requisitions")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1

    pr = body[0]
    # camelCase keys, matching frontend/types/procurement.ts exactly —
    # not prNumber vs pr_number, not requiredDate vs required_date.
    assert pr["prNumber"] == "PR-2026-00999"
    assert pr["requiredDate"] == "2026-12-01"
    assert pr["hasBeenAnalyzed"] is True
    assert pr["material"]["materialName"] == "Test Bearing"
    assert pr["material"]["partCode"] == "TB-0001"
    assert pr["estimatedValue"] == {"currency": "INR", "amount": 99000.0}

    # And explicitly NOT snake_case — a regression test for the exact
    # failure mode this whole schema layer exists to prevent.
    assert "pr_number" not in pr
    assert "required_date" not in pr


@pytest.mark.asyncio
async def test_get_requisition_detail_404_shape(client: AsyncClient):
    """Every error this API returns has the same {code, message} shape —
    see app/core/exceptions.py — asserted here for the 404 case
    specifically since it's the one every frontend list→detail
    navigation can trigger on a stale link."""
    response = await client.get("/api/v1/requisitions/PR-DOES-NOT-EXIST")

    assert response.status_code == 404
    body = response.json()
    assert body["code"] == "requisition_not_found"
    assert "PR-DOES-NOT-EXIST" in body["message"]


@pytest.mark.asyncio
async def test_filter_query_param_narrows_results(client: AsyncClient, db_session: AsyncSession):
    await _seed_one_requisition(db_session)
    db_session.add(
        Requisition(
            id="pr-test-2",
            pr_number="PR-2026-01000",
            material_name="Exception PR",
            quantity=10,
            unit="unit",
            drawing_revision_available=False,
            required_date=date(2026, 12, 5),
            requesting_department="Test Department",
            status="RECEIVED",
            exceptions=["VALIDATION_FAILED"],
            created_at=datetime(2026, 9, 1, tzinfo=UTC),
            updated_at=datetime(2026, 9, 1, tzinfo=UTC),
            has_been_analyzed=False,
        )
    )
    await db_session.commit()

    response = await client.get("/api/v1/requisitions", params={"filter": "exceptions"})

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["prNumber"] == "PR-2026-01000"

