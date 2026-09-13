from app.ai.agents.base import BaseProcurementAgent
from app.ai.prompts import supplier_prompt
from app.ai.schemas import SupplierAnalysis


class SupplierAgent(BaseProcurementAgent):
    name = "supplier_agent"
    label = "Supplier Intelligence"

    async def run(self, facts: dict) -> SupplierAnalysis:
        return await self.structured(supplier_prompt(facts), SupplierAnalysis)

