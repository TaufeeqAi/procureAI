"""General chatbot using LangChain tool calling for system-wide queries."""
from __future__ import annotations
import json
from datetime import UTC, datetime
from uuid import uuid4
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.tools import StructuredTool
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.config import get_ai_settings
from app.ai.errors import AIConfigurationError
from app.ai.runtime import build_llm
from app.models.requisition import Requisition
from app.models.supplier import Supplier
from app.models.quote import Quote
from app.models.delivery import Delivery

GENERAL_SYSTEM_PROMPT = """
You are the Procurement AI Assistant for Elecon Procurement AI.
You help procurement professionals with system-wide questions.
RULES:
1. Use the available tools to fetch real data. Never fabricate numbers.
2. Be concise and actionable.
3. If a tool returns no data, say so honestly.
"""

class GeneralChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.tools = self._build_tools()

    def _build_tools(self) -> list[StructuredTool]:
        return [
            StructuredTool.from_function(
                self._get_dashboard_summary,
                name="get_dashboard_summary",
                description="Get current dashboard KPIs: open PRs, AI-ready recommendations, pending approvals, exceptions.",
            ),
            StructuredTool.from_function(
                self._get_pending_approvals,
                name="get_pending_approvals",
                description="Get list of PRs currently awaiting approval.",
            ),
            StructuredTool.from_function(
                self._get_supplier_risks,
                name="get_supplier_risks",
                description="Get suppliers flagged with elevated risk.",
            ),
            StructuredTool.from_function(
                self._get_cost_savings,
                name="get_cost_savings",
                description="Get cost-saving opportunities and estimated savings.",
            ),
        ]

    async def _get_dashboard_summary(self) -> str:
        requisitions = (await self.db.execute(select(Requisition))).scalars().all()
        open_prs = len([pr for pr in requisitions if str(pr.status).upper() != "COMPLETED"])
        pending = len([pr for pr in requisitions if str(pr.status).upper() in ("ANALYSIS_READY", "AWAITING_APPROVAL")])
        exceptions = len([pr for pr in requisitions if pr.exceptions])
        return json.dumps({"open_prs": open_prs, "pending_approvals": pending, "exceptions": exceptions})

    async def _get_pending_approvals(self) -> str:
        requisitions = (await self.db.execute(
            select(Requisition).where(Requisition.status.in_(["ANALYSIS_READY", "AWAITING_APPROVAL"]))
        )).scalars().all()
        items = [{"pr_number": r.pr_number, "material": r.material_name, "status": r.status} for r in requisitions]
        return json.dumps(items) if items else "No PRs currently awaiting approval."

    async def _get_supplier_risks(self) -> str:
        suppliers = (await self.db.execute(select(Supplier))).scalars().all()
        risky = [{"name": s.name, "risk_level": s.risk_level} for s in suppliers if s.risk_level in ("HIGH", "MEDIUM")]
        return json.dumps(risky) if risky else "No suppliers currently flagged with elevated risk."

    async def _get_cost_savings(self) -> str:
        quotes = (await self.db.execute(select(Quote))).scalars().all()
        suppliers = {s.id: s for s in (await self.db.execute(select(Supplier))).scalars().all()}
        total_savings = 0.0
        for q in quotes:
            supplier = suppliers.get(q.supplier_id)
            if supplier and supplier.average_unit_price_amount and q.unit_price_amount:
                if q.unit_price_amount < supplier.average_unit_price_amount:
                    total_savings += (supplier.average_unit_price_amount - q.unit_price_amount) * (q.quantity or 1)
        return json.dumps({"total_estimated_savings_inr": round(total_savings, 2)})

    async def answer(self, message: str) -> dict:
        config = get_ai_settings()
        if not config.groq_api_key:
            raise AIConfigurationError("GROQ_API_KEY is not configured.")

        llm = build_llm(config.ai, config.groq_api_key)
        llm_with_tools = llm.bind_tools(self.tools)

        messages = [SystemMessage(content=GENERAL_SYSTEM_PROMPT), HumanMessage(content=message)]
        
        # Tool-calling loop
        for _ in range(3):
            response = await llm_with_tools.ainvoke(messages)
            if not response.tool_calls:
                break
            messages.append(response)
            for tool_call in response.tool_calls:
                tool = next((t for t in self.tools if t.name == tool_call["name"]), None)
                if tool:
                    result = await tool.ainvoke(tool_call["args"])
                    messages.append(AIMessage(content=str(result), tool_call_id=tool_call["id"]))

        return {
            "answer": response.content if hasattr(response, "content") else str(response),
            "mode": "general",
        }