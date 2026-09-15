from __future__ import annotations

from app.ai.agents.base import BaseProcurementAgent
from app.ai.prompts import question_prompt
from app.ai.schemas import AIQuestionAnswer


class QuestionAgent(BaseProcurementAgent):
    name = "question_agent"
    label = "Procurement Assistant"

    async def run(self, facts: dict, question: str) -> AIQuestionAnswer:
        return await self.structured(question_prompt(facts, question), AIQuestionAnswer)
