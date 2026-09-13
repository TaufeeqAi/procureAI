from __future__ import annotations

import json

from langchain_core.messages import HumanMessage, ToolMessage
from langchain_core.tools import StructuredTool

from app.ai.agents.base import BaseProcurementAgent
from app.ai.errors import AIExecutionError
from app.ai.prompts import final_prompt
from app.ai.schemas import FinalAIAnalysis


class ProcurementAnalystAgent(BaseProcurementAgent):
    name = "procurement_analyst"
    label = "Procurement Analyst"

    async def run(self, facts: dict) -> FinalAIAnalysis:
        """Force one explicit authoritative-facts inspection before final writing.

        This is intentionally a small tool loop. The tool is read-only and
        closure-bound to the already-loaded authoritative Phase 4 context.
        The LLM cannot pass arbitrary database identifiers to access data.
        """

        def authoritative_facts() -> str:
            return json.dumps(facts, ensure_ascii=False, sort_keys=True, default=str)

        fact_tool = StructuredTool.from_function(
            authoritative_facts,
            name="get_authoritative_procurement_facts",
            description="Read-only access to the authoritative Phase 4 procurement facts supplied to this run.",
        )
        tool_model = self.llm.bind_tools([fact_tool])
        inspected = await tool_model.ainvoke([HumanMessage(content=final_prompt(facts))])

        if inspected.tool_calls:
            tool_call = inspected.tool_calls[0]
            if tool_call["name"] != fact_tool.name:
                raise AIExecutionError("Analyst attempted to call a non-authoritative tool.")
            observation = fact_tool.invoke({})
            inspected = await tool_model.ainvoke(
                [
                    HumanMessage(content=final_prompt(facts)),
                    inspected,
                    ToolMessage(content=observation, tool_call_id=tool_call["id"]),
                ]
            )

        # A second, schema-constrained pass turns the analyst's inspected context
        # into the contract consumed by the application service.
        context_prompt = (
            f"{final_prompt(facts)}\n\nANALYST INSPECTION:\n{inspected.content or ''}"
        )
        return await self.structured(context_prompt, FinalAIAnalysis)

