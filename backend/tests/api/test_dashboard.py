import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dashboard_on_empty_database_returns_zeroed_summary(client: AsyncClient):
    """An empty database is a real state this endpoint must handle
    gracefully (a fresh deployment before the seed script runs) — it
    should return valid zeroed data, not a 500."""
    response = await client.get("/api/v1/dashboard")

    assert response.status_code == 200
    body = response.json()
    assert body["summary"]["openPrs"] == 0
    assert body["decisionQueue"] == []
    assert body["standingBrief"]["paragraphs"]  # still produces a sentence, even with nothing to report


@pytest.mark.asyncio
async def test_nav_counts_on_empty_database(client: AsyncClient):
    response = await client.get("/api/v1/nav-counts")

    assert response.status_code == 200
    body = response.json()
    assert body == {
        "prQueue": 0,
        "awaitingSupplier": 0,
        "awaitingDecision": 0,
        "exceptions": 0,
        "supplierInbox": 0,
    }

