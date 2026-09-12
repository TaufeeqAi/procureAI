import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_intelligence_endpoint_returns_deterministic_shape(db_session):
    # Use the application test DB dependency exactly as existing API tests do.
    from app.api.deps import get_db

    async def override_db():
        yield db_session

    app.dependency_overrides[get_db] = override_db
    try:
        from app.models.supplier import Supplier
        from app.models.requisition import Requisition
        from app.models.quote import Quote
        from datetime import date, datetime, UTC

        s = Supplier(id="sup-test", code="SUP-TEST", name="Test Supplier", approval_status="APPROVED", risk_level="LOW", categories=["Bearings"],
                     on_time_delivery_rate=0.96, quality_acceptance_rate=0.98, response_rate=0.9, average_unit_price_amount=100,
                     average_unit_price_currency="INR", total_purchases=5, sample_size_transactions=5)
        pr = Requisition(id="pr-test", pr_number="PR-TEST-001", material_name="Bearing Housing", part_code="BH-1", quantity=10,
                         unit="unit", drawing_revision_available=True, required_date=date(2026, 9, 25), requesting_department="Test",
                         status="ANALYSIS_READY", exceptions=[], created_at=datetime.now(UTC), updated_at=datetime.now(UTC), has_been_analyzed=True)
        q = Quote(id="q-test", quote_reference="Q-TEST-001", requisition_id="pr-test", supplier_id="sup-test", source_document_name="q.pdf",
                  unit_price_amount=100, unit_price_currency="INR", quantity=10, freight_amount=100, freight_currency="INR",
                  tax_rate_percent=18, lead_time_days=5, payment_terms_days=45, validity_days=10, extracted_fields=[], conflicts=[],
                  validation_status="VALID", received_at=datetime.now(UTC))
        db_session.add_all([s, pr, q]); await db_session.commit()

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/requisitions/PR-TEST-001/intelligence")
        assert response.status_code == 200
        body = response.json()
        assert body["recommendation"]["supplierId"] == "sup-test"
        assert body["suppliers"][0]["scoreConfigVersion"] == "supplier-score.v1"
    finally:
        app.dependency_overrides.pop(get_db, None)
