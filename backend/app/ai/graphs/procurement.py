from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from langgraph.graph import END, START, StateGraph

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
    return {"agent": agent, "label": label, "status": status, "detail": detail, "timestamp": _timestamp()}


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

    async def requirement_node(state: ProcurementState):
        result = await requirement_agent.run(state["facts"])
        return {
            "requirement": result.model_dump(mode="json"),
            "activity": [_activity(requirement_agent.name, requirement_agent.label, "complete", "Requirement normalized and constraints extracted.")],
        }

    async def supplier_node(state: ProcurementState):
        result = await supplier_agent.run(state["facts"])
        return {
            "supplier_analysis": result.model_dump(mode="json"),
            "activity": [_activity(supplier_agent.name, supplier_agent.label, "complete", "Supplier ranking and trade-offs interpreted from deterministic facts.")],
        }

    async def quote_node(state: ProcurementState):
        result = await quote_agent.run(state["facts"])
        return {
            "quote_analysis": result.model_dump(mode="json"),
            "activity": [_activity(quote_agent.name, quote_agent.label, "complete", "Quote validation and commercial observations interpreted.")],
        }

    async def risk_node(state: ProcurementState):
        result = await risk_agent.run(state["facts"])
        return {
            "risk_analysis": result.model_dump(mode="json"),
            "activity": [_activity(risk_agent.name, risk_agent.label, "complete", "Deterministic risk findings translated into mitigations.")],
        }

    async def negotiation_node(state: ProcurementState):
        facts = {
            **state["facts"],
            "supplier_analysis": state.get("supplier_analysis", {}),
            "risk_analysis": state.get("risk_analysis", {}),
        }
        result = await negotiation_agent.run(facts)
        return {
            "negotiation": result.model_dump(mode="json"),
            "activity": [_activity(negotiation_agent.name, negotiation_agent.label, "complete", "Negotiation draft generated from quote and benchmark evidence.")],
        }

    async def analyst_node(state: ProcurementState):
        facts = {
            **state["facts"],
            "requirement": state.get("requirement", {}),
            "supplier_analysis": state.get("supplier_analysis", {}),
            "quote_analysis": state.get("quote_analysis", {}),
            "risk_analysis": state.get("risk_analysis", {}),
            "negotiation": state.get("negotiation", {}),
        }
        result = await analyst_agent.run(facts)
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