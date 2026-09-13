from app.ai.agents.base import BaseProcurementAgent
from app.ai.prompts import quote_prompt
from app.ai.schemas import QuoteAnalysis


class QuoteAgent(BaseProcurementAgent):
    name = "quote_agent"
    label = "Quote Intelligence"

    async def run(self, facts: dict) -> QuoteAnalysis:
        return await self.structured(quote_prompt(facts), QuoteAnalysis)

