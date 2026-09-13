from app.ai.agents.base import BaseProcurementAgent
from app.ai.prompts import negotiation_prompt
from app.ai.schemas import NegotiationDraft


class NegotiationAgent(BaseProcurementAgent):
    name = "negotiation_agent"
    label = "Negotiation Agent"

    async def run(self, facts: dict) -> NegotiationDraft:
        return await self.structured(negotiation_prompt(facts), NegotiationDraft)

