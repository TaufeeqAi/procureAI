from __future__ import annotations

import asyncio
from typing import Any, TypeVar

from langchain_core.runnables import Runnable
from pydantic import BaseModel

from app.ai.config import AISettings
from app.ai.errors import AIExecutionError, AIOutputValidationError
from app.ai.runtime import build_llm

T = TypeVar("T", bound=BaseModel)


class BaseProcurementAgent:
    name = "base_agent"
    label = "Base Agent"

    def __init__(self, ai_settings: AISettings, groq_api_key: str, gemini_api_key: str, gemini_model: str):
        self.ai_settings = ai_settings
        self.llm = build_llm(ai_settings, groq_api_key, gemini_api_key, gemini_model)

    async def structured(self, prompt: str, schema: type[T]) -> T:
        last_error: Exception | None = None
        
        # Removed include_raw=True to prevent strict tool_choice="required" 
        # failures with models that might output plain text instead of tool calls.
        model: Runnable = self.llm.with_structured_output(schema)
        
        for attempt in range(1, self.ai_settings.max_agent_attempts + 1):
            try:
                async with asyncio.timeout(self.ai_settings.timeout_seconds):
                    # Without include_raw=True, this returns the parsed Pydantic model directly
                    parsed = await model.ainvoke(prompt)
                    
                if parsed is None:
                    raise AIOutputValidationError("LLM returned no structured output.")
                    
                if isinstance(parsed, schema):
                    return parsed
                    
                return schema.model_validate(parsed)
                
            except Exception as exc:  # retries are bounded by configuration
                last_error = exc
                if attempt >= self.ai_settings.max_agent_attempts:
                    break
                    
        raise AIExecutionError(
            f"{self.name} failed after {self.ai_settings.max_agent_attempts} attempts: {last_error}"
        ) from last_error