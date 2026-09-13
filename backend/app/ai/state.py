from __future__ import annotations

import operator
from typing import Annotated, Any, TypedDict


class ProcurementState(TypedDict, total=False):
    """Serializable state passed through the Phase 5 LangGraph.

    Only JSON-like values are stored in graph state. SQLAlchemy sessions and
    model instances never cross the graph boundary. This is essential for
    checkpoint safety, deterministic replay, and future distributed runners.
    """

    pr_number: str
    run_id: str
    thread_id: str
    facts: dict[str, Any]
    requirement: dict[str, Any]
    supplier_analysis: dict[str, Any]
    quote_analysis: dict[str, Any]
    risk_analysis: dict[str, Any]
    negotiation: dict[str, Any]
    final_analysis: dict[str, Any]
    recommendation: dict[str, Any]
    errors: Annotated[list[dict[str, Any]], operator.add]
    activity: Annotated[list[dict[str, Any]], operator.add]

