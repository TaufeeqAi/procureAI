from app.ai.agents.base import BaseProcurementAgent
from app.ai.prompts import requirement_prompt
from app.ai.schemas import RequirementAnalysis


class RequirementAgent(BaseProcurementAgent):
    name = "requirement_agent"
    label = "Requirement Agent"

    async def run(self, facts: dict) -> RequirementAnalysis:
        return await self.structured(requirement_prompt(facts), RequirementAnalysis)

