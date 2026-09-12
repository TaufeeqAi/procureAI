"""
Shared constants used across schemas/ and services/ — kept in its own
module rather than living inside one schema file, since
`WORKFLOW_STEP_ORDER` is consumed by requisition_service.py, not just by
a schema definition.
"""

# Mirrors lib/mock/queries.ts's `WORKFLOW_STEPS` on the frontend exactly —
# same statuses, same order. Deliberately excludes FULFILLMENT and
# COMPLETED, matching the frontend's own list (a completed PR doesn't need
# a "you are here" marker on an active-work stepper).
WORKFLOW_STEP_ORDER: dict[str, str] = {
    "RECEIVED": "Received",
    "VALIDATING": "Validated",
    "READY_FOR_SOURCING": "Sourcing",
    "RFQ_IN_PROGRESS": "RFQ",
    "RESPONSES_RECEIVED": "Quotes",
    "ANALYSIS_READY": "Decision",
    "AWAITING_APPROVAL": "Approval",
    "APPROVED": "Approved",
    "PO_CREATED": "PO",
}
