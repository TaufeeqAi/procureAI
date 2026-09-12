"""
Seeds the database with the same hero scenario the frontend's
lib/mock/*.ts files have carried since Phase 1 — same PR numbers, same
supplier names, same GST-verified quote numbers. This is a deliberate
choice: constructing ORM objects directly in Python rather than loading
intermediate JSON fixture files (the master plan's original seed/data/
layout) keeps this data in one type-checked place instead of two files
that could silently drift apart — the exact reasoning
docs/architecture/backend-contract-parity.md gives for the CamelModel
schema layer, applied to fixture data instead of API responses.

Run with: python -m seed.seed
"""

import asyncio
from datetime import UTC, date, datetime

from app.core.database import AsyncSessionLocal, Base, engine
from app.models.ai_recommendation import AgentRun, AIRecommendation
from app.models.communication import CommunicationMessage
from app.models.delivery import Delivery, DeliveryException, DeliveryTimelineStep
from app.models.notification import Notification
from app.models.purchase_order import POLineItem, PurchaseOrder
from app.models.quote import Quote
from app.models.requisition import Requisition
from app.models.rfq import RFQ, RFQRecipient
from app.models.supplier import Supplier, SupplierPriceHistoryPoint, SupplierTransactionRecord

UTC = UTC


def _dt(iso: str) -> datetime:
    return datetime.fromisoformat(iso)


async def seed_suppliers(session) -> dict[str, Supplier]:
    suppliers_data = [
        dict(id="sup-abc", code="SUP-ABC", name="ABC Precision", approval_status="APPROVED", risk_level="LOW",
             categories=["Bearings", "Housings"], on_time_delivery_rate=0.96, quality_acceptance_rate=0.984,
             response_rate=0.91, average_unit_price_amount=1184, average_unit_price_currency="INR",
             total_purchases=12, sample_size_units=246, sample_size_transactions=12,
             performance_measured_at=_dt("2026-09-04T09:00:00+05:30"), score_overall=94.2, score_price=91,
             score_quality=98.4, score_delivery=96, score_commercial=88, score_config_version="supplier-score.v1"),
        dict(id="sup-xyz", code="SUP-XYZ", name="XYZ Industrial", approval_status="APPROVED", risk_level="MEDIUM",
             categories=["Gear Assemblies", "Shafts"], on_time_delivery_rate=0.87, quality_acceptance_rate=0.952,
             response_rate=0.88, average_unit_price_amount=1162, average_unit_price_currency="INR",
             total_purchases=18, sample_size_units=340, sample_size_transactions=18,
             performance_measured_at=_dt("2026-09-04T09:00:00+05:30"), score_overall=89.7, score_price=93,
             score_quality=95.2, score_delivery=87, score_commercial=84, score_config_version="supplier-score.v1"),
        dict(id="sup-pqr", code="SUP-PQR", name="PQR Engineering", approval_status="APPROVED", risk_level="HIGH",
             categories=["Bearings", "Couplings"], on_time_delivery_rate=0.74, quality_acceptance_rate=0.91,
             response_rate=0.79, average_unit_price_amount=1118, average_unit_price_currency="INR",
             total_purchases=9, sample_size_units=158, sample_size_transactions=9,
             performance_measured_at=_dt("2026-09-04T09:00:00+05:30"), score_overall=78.1, score_price=97,
             score_quality=91, score_delivery=74, score_commercial=80, score_config_version="supplier-score.v1"),
        dict(id="sup-lmn", code="SUP-LMN", name="LMN Components", approval_status="APPROVED", risk_level="LOW",
             categories=["Fasteners", "Couplings"], on_time_delivery_rate=0.89, quality_acceptance_rate=0.941,
             response_rate=0.86, average_unit_price_amount=742, average_unit_price_currency="INR",
             total_purchases=15, sample_size_units=210, sample_size_transactions=15,
             performance_measured_at=_dt("2026-09-01T09:00:00+05:30"), score_overall=85.4, score_price=88,
             score_quality=94.1, score_delivery=89, score_commercial=82, score_config_version="supplier-score.v1"),
        dict(id="sup-sundar", code="SUP-SFT", name="Sundar Fasteners", approval_status="APPROVED", risk_level="LOW",
             categories=["Fasteners"], on_time_delivery_rate=0.93, quality_acceptance_rate=0.96, response_rate=0.9,
             average_unit_price_amount=214, average_unit_price_currency="INR", total_purchases=22,
             sample_size_units=890, sample_size_transactions=22, performance_measured_at=_dt("2026-08-28T09:00:00+05:30"),
             score_overall=90.1, score_price=90, score_quality=96, score_delivery=93, score_commercial=85,
             score_config_version="supplier-score.v1"),
        dict(id="sup-vikram", code="SUP-VKF", name="Vikram Forge", approval_status="APPROVED", risk_level="MEDIUM",
             categories=["Shafts", "Forgings"], on_time_delivery_rate=0.81, quality_acceptance_rate=0.93,
             response_rate=0.77, average_unit_price_amount=2140, average_unit_price_currency="INR",
             total_purchases=7, sample_size_units=96, sample_size_transactions=7,
             performance_measured_at=_dt("2026-08-20T09:00:00+05:30"), score_overall=82.6, score_price=86,
             score_quality=93, score_delivery=81, score_commercial=79, score_config_version="supplier-score.v1"),
        dict(id="sup-bharat", code="SUP-BBR", name="Bharat Bearings", approval_status="APPROVED", risk_level="LOW",
             categories=["Bearings"], on_time_delivery_rate=0.95, quality_acceptance_rate=0.97, response_rate=0.93,
             average_unit_price_amount=1090, average_unit_price_currency="INR", total_purchases=14,
             sample_size_units=268, sample_size_transactions=14, performance_measured_at=_dt("2026-08-30T09:00:00+05:30"),
             score_overall=92.8, score_price=92, score_quality=97, score_delivery=95, score_commercial=87,
             score_config_version="supplier-score.v1"),
        dict(id="sup-continental", code="SUP-CGR", name="Continental Gears", approval_status="APPROVED",
             risk_level="MEDIUM", categories=["Gear Assemblies"], on_time_delivery_rate=0.84,
             quality_acceptance_rate=0.94, response_rate=0.82, average_unit_price_amount=3120,
             average_unit_price_currency="INR", total_purchases=11, sample_size_units=132,
             sample_size_transactions=11, performance_measured_at=_dt("2026-08-22T09:00:00+05:30"),
             score_overall=86.9, score_price=84, score_quality=94, score_delivery=84, score_commercial=88,
             score_config_version="supplier-score.v1"),
        dict(id="sup-precision-tool", code="SUP-PTW", name="Precision Tool Works", approval_status="APPROVED",
             risk_level="LOW", categories=["Tooling", "Housings"], on_time_delivery_rate=0.91,
             quality_acceptance_rate=0.965, response_rate=0.89, average_unit_price_amount=1560,
             average_unit_price_currency="INR", total_purchases=10, sample_size_units=120,
             sample_size_transactions=10, performance_measured_at=_dt("2026-08-18T09:00:00+05:30"),
             score_overall=89.0, score_price=87, score_quality=96.5, score_delivery=91, score_commercial=86,
             score_config_version="supplier-score.v1"),
        dict(id="sup-omsai", code="SUP-OSI", name="Om Sai Industries", approval_status="PENDING_APPROVAL",
             risk_level="HIGH", categories=["Fasteners", "Couplings"], on_time_delivery_rate=0.68,
             quality_acceptance_rate=0.88, response_rate=0.6, total_purchases=3, sample_size_transactions=3,
             performance_measured_at=_dt("2026-07-30T09:00:00+05:30"), score_overall=61.2, score_price=95,
             score_quality=88, score_delivery=68, score_commercial=70, score_config_version="supplier-score.v1"),
    ]

    suppliers = {}
    for data in suppliers_data:
        supplier = Supplier(**data)
        session.add(supplier)
        suppliers[data["id"]] = supplier

    # ABC's price history and recent transactions — the only supplier the
    # frontend's mock ever hand-authored this depth for; see the module
    # docstring in models/supplier.py.
    for occurred_on, amount, po_ref in [
        (date(2026, 3, 14), 1210, "PO-2026-00192"),
        (date(2026, 5, 2), 1190, "PO-2026-00271"),
        (date(2026, 6, 20), 1205, "PO-2026-00318"),
        (date(2026, 9, 4), 1180, "ABC-9841"),
    ]:
        session.add(SupplierPriceHistoryPoint(
            supplier_id="sup-abc", occurred_on=occurred_on, unit_price_amount=amount,
            unit_price_currency="INR", po_reference=po_ref,
        ))

    for tx_id_suffix, po_ref, material, amount, on_time, quality, occurred_on in [
        ("1", "PO-2026-00291", "Bearing Housing", 1170, True, True, date(2026, 7, 30)),
        ("2", "PO-2026-00271", "Bearing Housing", 1195, True, True, date(2026, 5, 2)),
        ("3", "PO-2026-00254", "Gear Component", 1188, False, True, date(2026, 3, 18)),
    ]:
        session.add(SupplierTransactionRecord(
            id=f"txn-abc-{tx_id_suffix}", supplier_id="sup-abc", po_reference=po_ref, material_name=material,
            unit_price_amount=amount, unit_price_currency="INR", delivered_on_time=on_time,
            quality_accepted=quality, occurred_on=occurred_on,
        ))

    return suppliers


async def seed_requisitions(session) -> dict[str, Requisition]:
    hero_and_neighbors = [
        dict(id="pr-00983", pr_number="PR-2026-00983", material_name="Bearing Housing", part_code="BH-2045",
             quantity=200, unit="unit", application="Gearbox Assembly", drawing_reference="BH-2045-R3",
             drawing_revision_available=False, required_date=date(2026, 9, 25),
             requesting_department="Gear Manufacturing", status="ANALYSIS_READY", exceptions=[],
             estimated_value_amount=282020, estimated_value_currency="INR",
             created_at=_dt("2026-09-01T08:10:00+05:30"), updated_at=_dt("2026-09-04T10:21:00+05:30"),
             has_been_analyzed=True),
        dict(id="pr-00976", pr_number="PR-2026-00976", material_name="Gear Assembly", part_code="GA-1180",
             quantity=50, unit="unit", application="Transmission Line 2", drawing_revision_available=True,
             required_date=date(2026, 9, 20), requesting_department="Transmission Assembly",
             status="RESPONSES_RECEIVED", exceptions=["DELIVERY_RISK"], estimated_value_amount=194500,
             estimated_value_currency="INR", created_at=_dt("2026-08-29T09:00:00+05:30"),
             updated_at=_dt("2026-09-04T09:40:00+05:30"), has_been_analyzed=False),
        dict(id="pr-00971", pr_number="PR-2026-00971", material_name="Bearing Set", part_code="BS-3390",
             quantity=120, unit="unit", application="Gear Coupling Line", drawing_revision_available=True,
             required_date=date(2026, 9, 18), requesting_department="Gear Manufacturing", status="ANALYSIS_READY",
             exceptions=[], estimated_value_amount=152400, estimated_value_currency="INR",
             created_at=_dt("2026-08-27T09:00:00+05:30"), updated_at=_dt("2026-09-04T08:55:00+05:30"),
             has_been_analyzed=True),
        dict(id="pr-00968", pr_number="PR-2026-00968", material_name="Shaft Assembly", part_code="SA-2210",
             quantity=80, unit="unit", application="Drive Line", drawing_revision_available=True,
             required_date=date(2026, 9, 16), requesting_department="Drive Systems", status="RFQ_IN_PROGRESS",
             exceptions=[], estimated_value_amount=176000, estimated_value_currency="INR",
             created_at=_dt("2026-08-25T09:00:00+05:30"), updated_at=_dt("2026-09-04T09:58:00+05:30"),
             has_been_analyzed=False),
        dict(id="pr-00961", pr_number="PR-2026-00961", material_name="Gear Coupling", part_code="GC-1750",
             quantity=25, unit="unit", application="Auxiliary Drive", drawing_revision_available=False,
             required_date=date(2026, 9, 22), requesting_department="Gear Manufacturing", status="RECEIVED",
             exceptions=["VALIDATION_FAILED"], estimated_value_amount=61250, estimated_value_currency="INR",
             created_at=_dt("2026-09-03T09:00:00+05:30"), updated_at=_dt("2026-09-04T08:10:00+05:30"),
             has_been_analyzed=False),
        # Antecedent PRs behind the pre-existing POs (PO-2026-001288/001274/001261) —
        # named but not otherwise detailed, since they represent already-
        # completed procurement cycles from before this dataset's "now".
        dict(id="pr-00954", pr_number="PR-2026-00954", material_name="Bearing Housing", part_code="BH-2045",
             quantity=200, unit="unit", drawing_revision_available=True, required_date=date(2026, 9, 14),
             requesting_department="Gear Manufacturing", status="PO_CREATED", exceptions=[],
             estimated_value_amount=234000, estimated_value_currency="INR",
             created_at=_dt("2026-08-15T09:00:00+05:30"), updated_at=_dt("2026-09-04T11:18:00+05:30"),
             has_been_analyzed=True),
        dict(id="pr-00942", pr_number="PR-2026-00942", material_name="Gear Assembly", part_code="GA-1180",
             quantity=100, unit="unit", drawing_revision_available=True, required_date=date(2026, 9, 1),
             requesting_department="Transmission Assembly", status="PO_CREATED", exceptions=[],
             estimated_value_amount=114000, estimated_value_currency="INR",
             created_at=_dt("2026-08-10T09:00:00+05:30"), updated_at=_dt("2026-08-21T09:00:00+05:30"),
             has_been_analyzed=True),
        dict(id="pr-00931", pr_number="PR-2026-00931", material_name="Shaft Assembly", part_code="SA-2210",
             quantity=80, unit="unit", drawing_revision_available=True, required_date=date(2026, 9, 18),
             requesting_department="Drive Systems", status="PO_CREATED", exceptions=[],
             estimated_value_amount=171200, estimated_value_currency="INR",
             created_at=_dt("2026-08-05T09:00:00+05:30"), updated_at=_dt("2026-08-26T09:00:00+05:30"),
             has_been_analyzed=True),
    ]

    requisitions = {}
    for data in hero_and_neighbors:
        pr = Requisition(**data)
        session.add(pr)
        requisitions[data["id"]] = pr

    # Bulk filler — generated deterministically. The status list below is
    # explicitly enumerated to produce the Phase 1 mock sidebar counts:
    # 12 RFQ_IN_PROGRESS, 9 (ANALYSIS_READY + RESPONSES_RECEIVED), 4 exceptions.
    filler_materials = [
        ("Hex Bolt M12", "HB-1120", "Fastener Stores", "box"),
        ("Roller Bearing", "RB-4410", "Gear Manufacturing", "unit"),
        ("Drive Coupling", "DC-2290", "Drive Systems", "unit"),
        ("Forged Flange", "FF-3301", "Forging Shop", "unit"),
        ("Spur Gear", "SG-1004", "Gear Manufacturing", "unit"),
        ("Retaining Ring", "RR-8820", "Fastener Stores", "box"),
        ("Housing Cover", "HC-5502", "Assembly Line 1", "unit"),
        ("Bevel Gear", "BG-1187", "Gear Manufacturing", "unit"),
    ]
    filler_statuses = (
        ["RFQ_IN_PROGRESS"] * 11 +
        ["RESPONSES_RECEIVED"] * 6 +
        ["READY_FOR_SOURCING"] * 5 +
        ["VALIDATING"] * 4 +
        ["AWAITING_APPROVAL"] * 4 +
        ["RECEIVED"] * 3 +
        ["PO_CREATED"] * 1
    )
    for i in range(34):
        name, part, dept, unit = filler_materials[i % len(filler_materials)]
        status = filler_statuses[i]
        pr_id = f"pr-gen-{i}"
        pr = Requisition(
            id=pr_id,
            pr_number=f"PR-2026-{(908 - i):05d}",
            material_name=name,
            part_code=part,
            quantity=20 + ((i * 7) % 180),
            unit=unit,
            drawing_revision_available=i % 4 != 0,
            required_date=date(2026, 10, min(2 + (i % 26), 28)),
            requesting_department=dept,
            status=status,
            exceptions=["NO_SUPPLIER_RESPONSE"] if i % 9 == 0 else [],
            estimated_value_amount=40000 + i * 3175,
            estimated_value_currency="INR",
            created_at=_dt("2026-08-15T09:00:00+05:30"),
            updated_at=_dt("2026-09-03T09:00:00+05:30"),
            has_been_analyzed=status in ("AWAITING_APPROVAL", "PO_CREATED"),
        )
        session.add(pr)
        requisitions[pr_id] = pr

    return requisitions


async def seed_sourcing(session) -> None:
    rfq = RFQ(id="rfq-00481", rfq_number="RFQ-2026-00481", requisition_id="pr-00983",
              material_name="Bearing Housing", due_date=_dt("2026-09-12T18:00:00+05:30"),
              created_at=_dt("2026-09-01T09:30:00+05:30"))
    session.add(rfq)

    recipients_data = [
        ("rr-abc", "sup-abc", "RESPONDED", "2026-09-01T09:32:00+05:30", "2026-09-04T09:32:00+05:30", 0, "COMPLETE",
         [{"field": "quantity", "label": "Quantity", "value": "200", "status": "MATCHED"},
          {"field": "unitPrice", "label": "Unit price", "value": "₹1,180", "status": "MATCHED"},
          {"field": "deliveryDate", "label": "Delivery", "value": "23 Sep 2026", "status": "MATCHED"},
          {"field": "paymentTerms", "label": "Payment terms", "value": "45 days", "status": "MATCHED"}]),
        ("rr-xyz", "sup-xyz", "RESPONDED", "2026-09-01T09:32:00+05:30", "2026-09-04T10:52:00+05:30", 1, "PARTIAL",
         [{"field": "quantity", "label": "Quantity", "value": "200", "status": "MATCHED"},
          {"field": "unitPrice", "label": "Unit price", "value": "₹1,150", "status": "MATCHED"},
          {"field": "deliveryDate", "label": "Delivery", "value": "28 Sep 2026 or 30 Sep 2026", "status": "CONFLICT"},
          {"field": "paymentTerms", "label": "Payment terms", "value": "30 days", "status": "MATCHED"}]),
        ("rr-pqr", "sup-pqr", "RESPONDED", "2026-09-01T09:32:00+05:30", "2026-09-03T16:10:00+05:30", 0, "COMPLETE",
         [{"field": "quantity", "label": "Quantity", "value": "200", "status": "MATCHED"},
          {"field": "unitPrice", "label": "Unit price", "value": "₹1,110", "status": "MATCHED"},
          {"field": "deliveryDate", "label": "Delivery", "value": "05 Oct 2026", "status": "MATCHED"},
          {"field": "paymentTerms", "label": "Payment terms", "value": "30 days", "status": "MATCHED"}]),
    ]
    for rid, supplier_id, status, sent_at, responded_at, reminders, completeness, fields in recipients_data:
        session.add(RFQRecipient(
            id=rid, rfq_id="rfq-00481", supplier_id=supplier_id, status=status,
            sent_at=_dt(sent_at), responded_at=_dt(responded_at), reminders_sent=reminders,
            extracted_fields=fields, completeness=completeness,
        ))

    messages = [
        ("msg-abc-1", "rr-abc", "ELECON", "Please confirm availability of 200 units of BH-2045 by 25 September 2026.", "2026-09-01T09:32:00+05:30", False),
        ("msg-abc-2", "rr-abc", "SUPPLIER", "We can supply 200 pcs at ₹1,180. Delivery 23 Sept. Payment 45 days. Quotation attached.", "2026-09-04T09:32:00+05:30", False),
        ("msg-xyz-1", "rr-xyz", "ELECON", "Please confirm availability of 200 units of BH-2045 by 25 September 2026.", "2026-09-01T09:32:00+05:30", False),
        ("msg-xyz-2", "rr-xyz", "ELECON", "Following up — could you share your quotation for BH-2045 this week?", "2026-09-03T09:00:00+05:30", False),
        ("msg-xyz-3", "rr-xyz", "SUPPLIER", "Apologies for the delay. 200 units at ₹1,150/unit, freight ₹4,500. Quotation attached — please note our line-item delivery date differs slightly from the terms page; we'll confirm by phone.", "2026-09-04T10:52:00+05:30", False),
        ("msg-pqr-1", "rr-pqr", "ELECON", "Please confirm availability of 200 units of BH-2045 by 25 September 2026.", "2026-09-01T09:32:00+05:30", False),
        ("msg-pqr-2", "rr-pqr", "SUPPLIER", "200 units available at ₹1,110/unit. Lead time 31 days from PO. Freight ₹2,500, 30-day payment terms.", "2026-09-03T16:10:00+05:30", False),
    ]
    for mid, recipient_id, sender, body, sent_at, requires_approval in messages:
        session.add(CommunicationMessage(
            id=mid, recipient_id=recipient_id, sender=sender, body=body,
            sent_at=_dt(sent_at), requires_approval=requires_approval,
        ))

    # Secondary RFQs (PR-00976, PR-00968) — recipients set to SENT/NO_RESPONSE
    # so the supplier inbox count stays at 3 (the hero PR's responses only).
    session.add(RFQ(id="rfq-00477", rfq_number="RFQ-2026-00477", requisition_id="pr-00976",
                     material_name="Gear Assembly", due_date=_dt("2026-09-10T18:00:00+05:30"),
                     created_at=_dt("2026-08-30T08:55:00+05:30")))
    for rid, supplier_id, sent_at in [
        ("rr-continental", "sup-continental", "2026-08-30T09:00:00+05:30"),
        ("rr-vikram-976", "sup-vikram", "2026-08-30T09:00:00+05:30"),
        ("rr-xyz-976", "sup-xyz", "2026-08-30T09:00:00+05:30"),
        ("rr-ptw-976", "sup-precision-tool", "2026-08-30T09:00:00+05:30"),
    ]:
        session.add(RFQRecipient(id=rid, rfq_id="rfq-00477", supplier_id=supplier_id, status="SENT",
                                  sent_at=_dt(sent_at), responded_at=None, reminders_sent=0,
                                  extracted_fields=[], completeness="AWAITING"))

    session.add(RFQ(id="rfq-00472", rfq_number="RFQ-2026-00472", requisition_id="pr-00968",
                     material_name="Shaft Assembly", due_date=_dt("2026-09-06T18:00:00+05:30"),
                     created_at=_dt("2026-09-02T08:58:00+05:30")))
    session.add(RFQRecipient(id="rr-vikram-968", rfq_id="rfq-00472", supplier_id="sup-vikram", status="SENT",
                              sent_at=_dt("2026-09-02T09:00:00+05:30"), responded_at=None,
                              reminders_sent=0, extracted_fields=[], completeness="AWAITING"))
    session.add(RFQRecipient(id="rr-bharat-968", rfq_id="rfq-00472", supplier_id="sup-bharat", status="NO_RESPONSE",
                              sent_at=_dt("2026-09-02T09:00:00+05:30"), reminders_sent=1,
                              extracted_fields=[], completeness="AWAITING"))
    session.add(RFQRecipient(id="rr-lmn-968", rfq_id="rfq-00472", supplier_id="sup-lmn", status="NO_RESPONSE",
                              sent_at=_dt("2026-09-02T09:00:00+05:30"), reminders_sent=1,
                              extracted_fields=[], completeness="AWAITING"))


async def seed_quotes(session) -> None:
    quotes_data = [
        dict(id="quote-abc-9841", quote_reference="ABC-9841", requisition_id="pr-00983", supplier_id="sup-abc",
             source_document_name="quotation_abc_9841.pdf", unit_price_amount=1180, unit_price_currency="INR",
             quantity=200, freight_amount=3000, freight_currency="INR", tax_rate_percent=18, lead_time_days=19,
             payment_terms_days=45, validity_days=30,
             extracted_fields=[
                 {"field": "quantity", "label": "Quantity", "value": "200", "confidence": 0.99},
                 {"field": "unitPrice", "label": "Unit price", "value": "₹1,180", "confidence": 0.99},
                 {"field": "freight", "label": "Freight", "value": "3,000", "confidence": 0.96},
                 {"field": "deliveryDate", "label": "Delivery", "value": "23 Sep 2026", "confidence": 0.93},
                 {"field": "paymentTerms", "label": "Payment", "value": "45 days", "confidence": 0.97},
             ],
             conflicts=[], validation_status="VALID", received_at=_dt("2026-09-04T09:32:00+05:30")),
        dict(id="quote-xyz-7718", quote_reference="XYZ-7718", requisition_id="pr-00983", supplier_id="sup-xyz",
             source_document_name="quotation_xyz_7718.pdf", unit_price_amount=1150, unit_price_currency="INR",
             quantity=200, freight_amount=4500, freight_currency="INR", tax_rate_percent=18, lead_time_days=24,
             payment_terms_days=30, validity_days=21,
             extracted_fields=[
                 {"field": "quantity", "label": "Quantity", "value": "200", "confidence": 0.98},
                 {"field": "unitPrice", "label": "Unit price", "value": "1,150", "confidence": 0.98},
                 {"field": "freight", "label": "Freight", "value": "₹4,500", "confidence": 0.9},
                 {"field": "deliveryDate", "label": "Delivery", "value": "28 Sep 2026", "confidence": 0.82},
                 {"field": "paymentTerms", "label": "Payment", "value": "30 days", "confidence": 0.95},
             ],
             conflicts=[{
                 "field": "deliveryDate", "label": "Delivery date",
                 "candidate_values": [
                     {"value": "28 Sep 2026", "source_location": "Page 1, line items"},
                     {"value": "30 Sep 2026", "source_location": "Page 2, delivery terms"},
                 ],
             }],
             validation_status="NEEDS_REVIEW", received_at=_dt("2026-09-04T10:52:00+05:30")),
        dict(id="quote-pqr-4811", quote_reference="PQR-4811", requisition_id="pr-00983", supplier_id="sup-pqr",
             source_document_name="quotation_pqr_4811.pdf", unit_price_amount=1110, unit_price_currency="INR",
             quantity=200, freight_amount=2500, freight_currency="INR", tax_rate_percent=18, lead_time_days=31,
             payment_terms_days=30, validity_days=15,
             extracted_fields=[
                 {"field": "quantity", "label": "Quantity", "value": "200", "confidence": 0.99},
                 {"field": "unitPrice", "label": "Unit price", "value": "₹1,110", "confidence": 0.99},
                 {"field": "freight", "label": "Freight", "value": "₹2,500", "confidence": 0.97},
                 {"field": "deliveryDate", "label": "Delivery", "value": "05 Oct 2026", "confidence": 0.95},
                 {"field": "paymentTerms", "label": "Payment", "value": "30 days", "confidence": 0.96},
             ],
             conflicts=[], validation_status="VALID", received_at=_dt("2026-09-03T16:10:00+05:30")),
    ]
    for data in quotes_data:
        session.add(Quote(**data))


async def seed_purchase_orders_and_deliveries(session) -> None:
    from app.calculations.pricing import compute_landed_cost

    pos = [
        dict(id="po-001288", po_number="PO-2026-001288", requisition_id="pr-00954", supplier_id="sup-abc",
             status="ACKNOWLEDGED", payment_terms_days=45, qty=200, unit_price=1170, freight=2800,
             material="Bearing Housing", expected_delivery=date(2026, 9, 14),
             created_at="2026-09-04T09:50:00+05:30", sent_at="2026-09-04T09:52:00+05:30",
             acknowledged_at="2026-09-04T11:18:00+05:30"),
        dict(id="po-001274", po_number="PO-2026-001274", requisition_id="pr-00942", supplier_id="sup-xyz",
             status="ACKNOWLEDGED", payment_terms_days=30, qty=100, unit_price=1140, freight=3600,
             material="Gear Assembly", expected_delivery=date(2026, 9, 1),
             created_at="2026-08-20T10:00:00+05:30", sent_at="2026-08-20T10:05:00+05:30",
             acknowledged_at="2026-08-21T09:00:00+05:30"),
        dict(id="po-001261", po_number="PO-2026-001261", requisition_id="pr-00931", supplier_id="sup-pqr",
             status="DISPATCHED", payment_terms_days=30, qty=80, unit_price=2140, freight=2100,
             material="Shaft Assembly", expected_delivery=date(2026, 9, 18),
             created_at="2026-08-25T09:00:00+05:30", sent_at="2026-08-25T09:10:00+05:30",
             acknowledged_at="2026-08-26T09:00:00+05:30"),
    ]

    for po_data in pos:
        cost = compute_landed_cost(po_data["qty"], po_data["unit_price"], po_data["freight"], 18)
        po = PurchaseOrder(
            id=po_data["id"], po_number=po_data["po_number"], requisition_id=po_data["requisition_id"],
            supplier_id=po_data["supplier_id"], status=po_data["status"],
            payment_terms_days=po_data["payment_terms_days"],
            subtotal_amount=cost.subtotal.amount, freight_amount=cost.freight.amount,
            tax_rate_percent=cost.tax_rate_percent, tax_amount=cost.tax_amount.amount,
            total_amount=cost.total.amount, currency="INR",
            validation_checks=[
                {"label": "Matches approved supplier", "passed": True},
                {"label": "Matches approved quantity", "passed": True},
                {"label": "Price matches approved quote", "passed": True},
                {"label": "Delivery matches approved commitment", "passed": po_data["status"] != "ACKNOWLEDGED" or po_data["id"] != "po-001274"},
            ],
            created_at=_dt(po_data["created_at"]), sent_at=_dt(po_data["sent_at"]),
            acknowledged_at=_dt(po_data["acknowledged_at"]),
        )
        session.add(po)
        session.add(POLineItem(
            id=f"li-{po_data['id']}", purchase_order_id=po_data["id"], material_name=po_data["material"],
            quantity=po_data["qty"], unit_price_amount=po_data["unit_price"], unit_price_currency="INR",
            line_value_amount=po_data["qty"] * po_data["unit_price"], expected_delivery=po_data["expected_delivery"],
        ))

    deliveries = [
        dict(id="del-001288", purchase_order_id="po-001288", expected_date=date(2026, 9, 14), qty_ordered=200,
             qty_received=0, status="EXPECTED", risk_level="LOW", last_comm="2026-09-04T11:18:00+05:30",
             timeline=[("PO_APPROVED", "PO approved", True), ("PO_SENT", "PO sent", True),
                       ("ACKNOWLEDGED", "Acknowledged", True), ("DISPATCHED", "Dispatched", False),
                       ("DELIVERED", "Delivered", False)],
             exceptions=[]),
        dict(id="del-001274", purchase_order_id="po-001274", expected_date=date(2026, 9, 1), qty_ordered=100,
             qty_received=0, status="AT_RISK", risk_level="HIGH", last_comm="2026-08-29T10:00:00+05:30",
             timeline=[("PO_APPROVED", "PO approved", True), ("PO_SENT", "PO sent", True),
                       ("ACKNOWLEDGED", "Acknowledged", True), ("DISPATCHED", "Dispatched", False),
                       ("DELIVERED", "Delivered", False)],
             exceptions=[("exc-001274-1", "HIGH", "Dispatch confirmation is overdue with three days of cover remaining.",
                          "2026-09-04T08:00:00+05:30", "Request dispatch update")]),
        dict(id="del-001261", purchase_order_id="po-001261", expected_date=date(2026, 9, 18), qty_ordered=80,
             qty_received=50, status="PARTIAL", risk_level="MEDIUM", last_comm="2026-09-02T14:00:00+05:30",
             timeline=[("PO_APPROVED", "PO approved", True), ("PO_SENT", "PO sent", True),
                       ("ACKNOWLEDGED", "Acknowledged", True), ("DISPATCHED", "Dispatched", True),
                       ("DELIVERED", "Delivered", False)],
             exceptions=[]),
    ]
    for d in deliveries:
        session.add(Delivery(
            id=d["id"], purchase_order_id=d["purchase_order_id"], expected_date=d["expected_date"],
            quantity_ordered=d["qty_ordered"], quantity_received=d["qty_received"], status=d["status"],
            risk_level=d["risk_level"], last_supplier_communication_at=_dt(d["last_comm"]),
        ))
        for seq, (key, label, completed) in enumerate(d["timeline"]):
            session.add(DeliveryTimelineStep(
                id=f"{d['id']}-step-{seq}", delivery_id=d["id"], key=key, label=label,
                completed=completed, sequence=seq,
            ))
        for exc_id, severity, message, detected_at, action in d["exceptions"]:
            session.add(DeliveryException(
                id=exc_id, delivery_id=d["id"], severity=severity, message=message,
                detected_at=_dt(detected_at), suggested_action_label=action,
            ))


async def seed_ai(session) -> None:
    session.add(AIRecommendation(
        id="rec-pr-00983", requisition_id="pr-00983", supplier_id="sup-abc", confidence=0.93,
        confidence_band="HIGH", recommendation_state="READY", overall_score=94.2,
        dimensions={
            "price": {"value": 0.91, "label": "Price", "detail": "2.1% below historical median"},
            "quality": {"value": 0.984, "label": "Quality", "detail": "98.4% historical acceptance"},
            "delivery": {"value": 0.96, "label": "Delivery", "detail": "96% on-time delivery"},
            "commercial_terms": {"value": 0.88, "label": "Commercial terms", "detail": "45-day payment terms"},
            "risk": {"value": 0.9, "label": "Risk", "detail": "LOW overall risk"},
        },
        reasons=[
            "Approved supplier with 12 previous comparable transactions",
            "98.4% historical quality acceptance across 246 units",
            "96% historical on-time delivery",
            "Quote priced 2.1% below the historical median for this material",
            "Required quantity and delivery date both confirmed in the supplier's response",
        ],
        trade_off="XYZ Industrial is ₹30 cheaper per unit, but ABC Precision has substantially stronger historical delivery reliability (96% vs. 87% on-time).",
        risks=[{"severity": "LOW", "message": "ABC's proposed delivery (19 days) is close to its historical average lead time — not a deviation, but worth noting."}],
        evidence=[
            {"id": "ev-1", "type": "PURCHASE_ORDER", "label": "PO-2026-00192", "as_of": "2026-03-14T00:00:00+05:30"},
            {"id": "ev-2", "type": "PURCHASE_ORDER", "label": "PO-2026-00271", "as_of": "2026-05-02T00:00:00+05:30"},
            {"id": "ev-3", "type": "PURCHASE_ORDER", "label": "PO-2026-00318", "as_of": "2026-06-20T00:00:00+05:30"},
            {"id": "ev-4", "type": "QUOTE", "label": "ABC-9841", "href": "/quotes/ABC-9841", "as_of": "2026-09-04T09:32:00+05:30"},
        ],
        policy_checks=[
            {"label": "Supplier is approved", "passed": True},
            {"label": "Quantity matches requisition", "passed": True},
            {"label": "Delivery date satisfies required date", "passed": True},
            {"label": "PR value within buyer approval limit", "passed": True, "detail": "₹2.82L is below the ₹5L buyer threshold"},
        ],
        alternatives=[
            {"supplier_id": "sup-xyz", "supplier_name": "XYZ Industrial", "overall_score": 89.7, "noteworthy_difference": "30/unit cheaper, weaker delivery history"},
            {"supplier_id": "sup-pqr", "supplier_name": "PQR Engineering", "overall_score": 78.1, "noteworthy_difference": "Lowest price, materially higher risk"},
        ],
        generated_at=_dt("2026-09-04T10:21:05+05:30"),
    ))

    runs = [
        ("run-req-00983", "REQUIREMENT_AGENT", "Requirement Agent", "pr-00983",
         "Parsed purchase requisition — 8 fields extracted, 1 warning (missing drawing revision).",
         "/requisitions/PR-2026-00983/requirement", "2026-09-01T08:10:30+05:30", "2026-09-01T08:10:42+05:30"),
        ("run-sup-00983", "SUPPLIER_INTELLIGENCE_AGENT", "Supplier Intelligence Agent", "pr-00983",
         "Evaluated 18 suppliers — 4 eligible, 3 shortlisted for RFQ.",
         "/requisitions/PR-2026-00983/sourcing", "2026-09-01T09:15:00+05:30", "2026-09-01T09:15:51+05:30"),
        ("run-comm-00983", "COMMUNICATION_AGENT", "Communication Agent", "pr-00983",
         "RFQ drafted and sent to 3 suppliers.", "/requisitions/PR-2026-00983/communication",
         "2026-09-01T09:30:00+05:30", "2026-09-01T09:32:10+05:30"),
        ("run-quote-00983", "QUOTE_INTELLIGENCE_AGENT", "Quote Intelligence Agent", "pr-00983",
         "3 quotations extracted, 24 fields normalized. 1 delivery-date conflict flagged (XYZ Industrial).",
         "/requisitions/PR-2026-00983/quotes", "2026-09-04T10:52:20+05:30", "2026-09-04T10:52:44+05:30"),
        ("run-analyst-00983", "PROCUREMENT_ANALYST", "Procurement Analyst", "pr-00983",
         "Supplier scores calculated. ABC Precision ranked #1 at 94.2, confidence 93%.",
         "/requisitions/PR-2026-00983/decision", "2026-09-04T10:20:40+05:30", "2026-09-04T10:21:05+05:30"),
        ("run-risk-00983", "RISK_AGENT", "Risk Agent", "pr-00983",
         "1 delivery-timing risk detected — ABC's proposed delivery is close to its historical average lead time.",
         "/requisitions/PR-2026-00983/decision", "2026-09-04T10:20:50+05:30", "2026-09-04T10:21:00+05:30"),
        ("run-req-00976", "RISK_AGENT", "Risk Agent", "pr-00976",
         "Delivery risk flagged from supplier response tone and historical OTD variance.",
         "/requisitions/PR-2026-00976", "2026-09-04T09:41:00+05:30", "2026-09-04T09:41:20+05:30"),
    ]
    for run_id, agent, label, req_id, summary, href, started, completed in runs:
        session.add(AgentRun(
            id=run_id, requisition_id=req_id, agent=agent, label=label, status="COMPLETED",
            summary=summary, output_href=href, started_at=_dt(started), completed_at=_dt(completed),
        ))

    session.add(AgentRun(
        id="run-comm-00968", requisition_id="pr-00968", agent="COMMUNICATION_AGENT", label="Communication Agent",
        status="WAITING_FOR_REVIEW",
        summary="Reminder drafted for 2 non-responding suppliers — awaiting buyer approval to send.",
        output_href="/requisitions/PR-2026-00968/sourcing", started_at=_dt("2026-09-04T09:58:00+05:30"),
    ))


async def seed_notifications(session) -> None:
    notifications = [
        ("notif-1", "ACTION_REQUIRED", "Purchase approval required",
         "PR-2026-00983 has a ready recommendation awaiting your decision.",
         "/requisitions/PR-2026-00983/decision", "2026-09-04T10:21:00+05:30", False),
        ("notif-2", "WARNING", "Dispatch confirmation overdue",
         "PO-2026-001274 has not received a dispatch update in 6 days.",
         "/deliveries/PO-2026-001274", "2026-09-04T08:00:00+05:30", False),
        ("notif-3", "RISK", "Delivery risk detected",
         "PR-2026-00976 supplier response indicates a delivery risk.",
         "/requisitions/PR-2026-00976", "2026-09-04T09:40:00+05:30", False),
        ("notif-4", "FINANCIAL", "Quote above historical benchmark",
         "PR-2026-00983: current quote is 12.4% above the historical benchmark on two of three lines.",
         "/requisitions/PR-2026-00983/quotes", "2026-09-04T09:35:00+05:30", True),
        ("notif-5", "INFORMATION", "Supplier response received",
         "ABC Precision responded to RFQ-2026-00481.", "/requisitions/PR-2026-00983/communication",
         "2026-09-04T09:32:00+05:30", True),
        ("notif-6", "SYSTEM", "RFQ reminder sent",
         "A reminder was sent to 2 suppliers for PR-2026-00968.", "/requisitions/PR-2026-00968/sourcing",
         "2026-09-04T09:58:00+05:30", True),
    ]
    for nid, severity, title, message, href, created_at, read in notifications:
        session.add(Notification(
            id=nid, severity=severity, title=title, message=message,
            entity_href=href, created_at=_dt(created_at), read=read,
        ))


async def main() -> None:
    async with engine.begin() as conn:
        # Idempotent for local/demo use: drop-and-recreate rather than
        # relying on migrations having already run — `alembic upgrade
        # head` is the real schema-management path (see README.md); this
        # is a convenience for `docker compose up` and local dev, not a
        # substitute for it in a shared environment.
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        await seed_suppliers(session)
        await seed_requisitions(session)
        await seed_sourcing(session)
        await seed_quotes(session)
        await seed_purchase_orders_and_deliveries(session)
        await seed_ai(session)
        await seed_notifications(session)
        await session.commit()

    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(main())