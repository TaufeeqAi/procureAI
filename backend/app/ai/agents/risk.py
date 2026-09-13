from app.ai.agents.base import BaseProcurementAgent
from app.ai.prompts import risk_prompt
from app.ai.schemas import RiskAnalysis


class RiskAgent(BaseProcurementAgent):
    name = "risk_agent"
    label = "Risk Assistant"

    async def run(self, facts: dict) -> RiskAnalysis:
        return await self.structured(risk_prompt(facts), RiskAnalysis)

