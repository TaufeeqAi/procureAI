from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central configuration, read once and cached (see `get_settings` below).

    Every field here has a sensible local-dev default so `uvicorn app.main:app`
    works out of the box against the docker-compose Postgres — production
    deployments override via real environment variables or a `.env` file,
    never by editing this file.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Elecon Procurement AI"
    api_v1_prefix: str = "/api/v1"
    environment: str = "development"
    demo_mode: bool = True
    debug: bool = True

    # asyncpg is the only async PostgreSQL driver used at runtime (see
    # docs/architecture — asyncpg is ~5x faster than psycopg3 for this
    # workload per current benchmarks). Alembic's migration runner needs
    # its own sync-capable URL on the same database — see
    # alembic/env.py for why that's derived from this one, not duplicated.
    database_url: str = "postgresql+asyncpg://elecon:elecon@localhost:5432/elecon_procurement"

    # Comma-separated in the environment, parsed to a list here so FastAPI's
    # CORS middleware gets a real list without callers needing to know the
    # env-var encoding.
    cors_origins_raw: str = "http://localhost:3000"

    log_level: str = "INFO"

    # ----------------------------------------------------------------------
    # Phase 5 & 6: AI and LangGraph Configuration
    # ----------------------------------------------------------------------
    langsmith_api_key: str | None = None
    langsmith_tracing: bool = False
    langgraph_checkpoint_enabled: bool = True
    langgraph_checkpoint_setup_required: bool = True
    
    # Primary LLM (Gemini)
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-1.5-pro"
    
    # Fallback LLM (Groq)
    groq_api_key: str | None = None
    groq_model: str = "qwen/qwen3-32b"
    groq_temperature: float = 0.0
    groq_max_tokens: int = 4096
    groq_timeout_seconds: float = 60.0
    groq_max_retries: int = 2
    
    ai_graph_version: str = "procurement-graph.v1"
    ai_prompt_version: str = "procurement-prompts.v1"
    
    # Phase 6: Real AI UX Streaming Configuration
    ai_ux_stream_heartbeat_seconds: float = 15.0

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]

    @property
    def sync_database_url(self) -> str:
        """Alembic's migration runner uses a sync driver (psycopg) on the
        same database — see alembic/env.py. Derived here, once, so the two
        URLs can never silently point at different databases."""
        return self.database_url.replace("postgresql+asyncpg://", "postgresql+psycopg://")


@lru_cache
def get_settings() -> Settings:
    """Cached so `Settings()` — which reads the environment and parses
    `.env` — only runs once per process, not once per request."""
    return Settings()