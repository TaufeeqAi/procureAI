from dataclasses import dataclass
from functools import lru_cache

from app.core.config import get_settings


@dataclass(frozen=True)
class AISettings:
    model: str
    temperature: float
    max_tokens: int
    timeout_seconds: float
    max_retries: int
    max_agent_attempts: int
    graph_version: str
    prompt_version: str


@dataclass(frozen=True)
class Settings:
    groq_api_key: str | None
    gemini_api_key: str | None
    gemini_model: str
    langsmith_api_key: str | None
    langsmith_tracing: bool
    langgraph_checkpoint_enabled: bool
    langgraph_checkpoint_setup_required: bool
    sync_database_url: str
    ai_ux_stream_heartbeat_seconds: float
    ai: AISettings


@lru_cache
def get_ai_settings() -> Settings:
    app = get_settings()
    return Settings(
        groq_api_key=app.groq_api_key,
        gemini_api_key=app.gemini_api_key,
        gemini_model=app.gemini_model,
        langsmith_api_key=app.langsmith_api_key,
        langsmith_tracing=app.langsmith_tracing,
        langgraph_checkpoint_enabled=app.langgraph_checkpoint_enabled,
        langgraph_checkpoint_setup_required=app.langgraph_checkpoint_setup_required,
        sync_database_url=app.sync_database_url,
        ai_ux_stream_heartbeat_seconds=app.ai_ux_stream_heartbeat_seconds,
        ai=AISettings(
            model=app.groq_model,
            temperature=app.groq_temperature,
            max_tokens=app.groq_max_tokens,
            timeout_seconds=app.groq_timeout_seconds,
            max_retries=app.groq_max_retries,
            max_agent_attempts=2,
            graph_version=app.ai_graph_version,
            prompt_version=app.ai_prompt_version,
        ),
    )