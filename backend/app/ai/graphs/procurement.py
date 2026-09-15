from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from langgraph.graph import END, START, StateGraph
from langgraph.types import StreamWriter

from app.ai.agents import (
    NegotiationAgent,
    ProcurementAnalystAgent,
    QuoteAgent,
    RequirementAgent,
    RiskAgent,
    SupplierAgent,
)
from app.ai.config import AISettings
from app.ai.state import ProcurementState


def _timestamp() -> str:
    return datetime.now(UTC).isoformat()


def _activity(agent: str, label: str, status: str, detail: str) -> dict[str, str]:
    return {
        "id": f"act-{uuid4().hex[:8]}",
        "agent": agent,
        "label": label,
        "status": status,
        "detail": detail,
        "timestamp": _timestamp(),
    }


def _stream_activity(writer: StreamWriter, agent: str, label: str, status: str, detail: str) -> None:
    writer({
        "kind": "activity",
        "activity": _activity(agent, label, status, detail),
    })


def build_procurement_graph(
    *,
    ai_settings: AISettings,
    groq_api_key: str,
    gemini_api_key: str,
    gemini_model: str,
    checkpointer=None,
):
    requirement_agent = RequirementAgent(ai_settings, groq_api_key, gemini_api_key, gemini_model)
    supplier_agent = SupplierAgent(ai_settings, groq_api_key, gemini_api_key, gemini_model)
    quote_agent = QuoteAgent(ai_settings, groq_api_key, gemini_api_key, gemini_model)
    risk_agent = RiskAgent(ai_settings, groq_api_key, gemini_api_key, gemini_model)
    negotiation_agent = NegotiationAgent(ai_settings, groq_api_key, gemini_api_key, gemini_model)
    analyst_agent = ProcurementAnalystAgent(ai_settings, groq_api_key, gemini_api_key, gemini_model)

    async def requirement_node(state: ProcurementState, writer: StreamWriter):
        _stream_activity(writer, requirement_agent.name, requirement_agent.label, "started", "Reading the requisition and requirement constraints.")
        try:
            result = await requirement_agent.run(state["facts"])
        except Exception as exc:
            _stream_activity(writer, requirement_agent.name, requirement_agent.label, "failed", "Requirement analysis failed.")
            raise exc
        _stream_activity(writer, requirement_agent.name, requirement_agent.label, "complete", "Requirement normalized and constraints extracted.")
        return {
            "requirement": result.model_dump(mode="json"),
            "activity": [_activity(requirement_agent.name, requirement_agent.label, "complete", "Requirement normalized and constraints extracted.")],
        }

    async def supplier_node(state: ProcurementState, writer: StreamWriter):
        _stream_activity(writer, supplier_agent.name, supplier_agent.label, "started", "Interpreting deterministic supplier ranking and trade-offs.")
        try:
            result = await supplier_agent.run(state["facts"])
        except Exception as exc:
            _stream_activity(writer, supplier_agent.name, supplier_agent.label, "failed", "Supplier analysis failed.")
            raise exc
        _stream_activity(writer, supplier_agent.name, supplier_agent.label, "complete", "Supplier ranking and trade-offs interpreted from deterministic facts.")
        return {
            "supplier_analysis": result.model_dump(mode="json"),
            "activity": [_activity(supplier_agent.name, supplier_agent.label, "complete", "Supplier ranking and trade-offs interpreted from deterministic facts.")],
        }

    async def quote_node(state: ProcurementState, writer: StreamWriter):
        _stream_activity(writer, quote_agent.name, quote_agent.label, "started", "Reviewing quote validation and commercial signals.")
        try:
            result = await quote_agent.run(state["facts"])
        except Exception as exc:
            _stream_activity(writer, quote_agent.name, quote_agent.label, "failed", "Quote analysis failed.")
            raise exc
        _stream_activity(writer, quote_agent.name, quote_agent.label, "complete", "Quote validation and commercial observations interpreted.")
        return {
            "quote_analysis": result.model_dump(mode="json"),
            "activity": [_activity(quote_agent.name, quote_agent.label, "complete", "Quote validation and commercial observations interpreted.")],
        }

    async def risk_node(state: ProcurementState, writer: StreamWriter):
        _stream_activity(writer, risk_agent.name, risk_agent.label, "started", "Interpreting deterministic delivery, quality, and supplier risk signals.")
        try:
            result = await risk_agent.run(state["facts"])
        except Exception as exc:
            _stream_activity(writer, risk_agent.name, risk_agent.label, "failed", "Risk analysis failed.")
            raise exc
        _stream_activity(writer, risk_agent.name, risk_agent.label, "complete", "Deterministic risk findings translated into mitigations.")
        return {
            "risk_analysis": result.model_dump(mode="json"),
            "activity": [_activity(risk_agent.name, risk_agent.label, "complete", "Deterministic risk findings translated into mitigations.")],
        }

    async def negotiation_node(state: ProcurementState, writer: StreamWriter):
        _stream_activity(writer, negotiation_agent.name, negotiation_agent.label, "started", "Drafting a negotiation position from the benchmark and risk context.")
        facts = {
            **state["facts"],
            "supplier_analysis": state.get("supplier_analysis", {}),
            "risk_analysis": state.get("risk_analysis", {}),
        }
        try:
            result = await negotiation_agent.run(facts)
        except Exception as exc:
            _stream_activity(writer, negotiation_agent.name, negotiation_agent.label, "failed", "Negotiation drafting failed.")
            raise exc
        _stream_activity(writer, negotiation_agent.name, negotiation_agent.label, "complete", "Negotiation draft generated from quote and benchmark evidence.")
        return {
            "negotiation": result.model_dump(mode="json"),
            "activity": [_activity(negotiation_agent.name, negotiation_agent.label, "complete", "Negotiation draft generated from quote and benchmark evidence.")],
        }

    async def analyst_node(state: ProcurementState, writer: StreamWriter):
        _stream_activity(writer, analyst_agent.name, analyst_agent.label, "started", "Synthesizing the decision narrative against the authoritative facts.")
        facts = {
            **state["facts"],
            "requirement": state.get("requirement", {}),
            "supplier_analysis": state.get("supplier_analysis", {}),
            "quote_analysis": state.get("quote_analysis", {}),
            "risk_analysis": state.get("risk_analysis", {}),
            "negotiation": state.get("negotiation", {}),
        }
        try:
            result = await analyst_agent.run(facts)
        except Exception as exc:
            _stream_activity(writer, analyst_agent.name, analyst_agent.label, "failed", "Procurement analyst synthesis failed.")
            raise exc
        _stream_activity(writer, analyst_agent.name, analyst_agent.label, "complete", "Decision recommendation synthesized and structured.")
        return {
            "final_analysis": result.model_dump(mode="json"),
            "activity": [_activity(analyst_agent.name, analyst_agent.label, "complete", "Decision recommendation synthesized and structured.")],
        }

    builder = StateGraph(ProcurementState)
    builder.add_node("requirement", requirement_node)
    builder.add_node("supplier", supplier_node)
    builder.add_node("quote", quote_node)
    builder.add_node("risk", risk_node)
    builder.add_node("negotiation", negotiation_node)
    builder.add_node("analyst", analyst_node)

    builder.add_edge(START, "requirement")
    builder.add_edge("requirement", "supplier")
    builder.add_edge("requirement", "quote")
    builder.add_edge("requirement", "risk")
    # Explicit barriers prevent downstream nodes from observing partial sibling state.
    builder.add_edge(["supplier", "risk"], "negotiation")
    builder.add_edge(["supplier", "quote", "risk", "negotiation"], "analyst")
    builder.add_edge("analyst", END)

    return builder.compile(checkpointer=checkpointer)