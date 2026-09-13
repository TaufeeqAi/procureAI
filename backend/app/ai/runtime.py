from __future__ import annotations

import re
from contextlib import asynccontextmanager

from langchain_core.language_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq

from app.ai.config import AISettings, Settings
from app.ai.errors import AIConfigurationError


def _checkpoint_dsn(sync_database_url: str) -> str:
    return re.sub(r"^postgresql\+psycopg://", "postgresql://", sync_database_url)


def build_llm(
    settings: AISettings,
    groq_api_key: str | None,
    gemini_api_key: str | None,
    gemini_model: str,
) -> BaseChatModel:
    primary_llm = None
    fallback_llm = None

    # 1. Initialize Primary (Gemini)
    if gemini_api_key:
        primary_llm = ChatGoogleGenerativeAI(
            model=gemini_model,
            google_api_key=gemini_api_key,
            temperature=settings.temperature,
            max_tokens=settings.max_tokens,
            timeout=settings.timeout_seconds,
            max_retries=settings.max_retries,
        )
    else:
        raise AIConfigurationError("GEMINI_API_KEY is not configured.")

    # 2. Initialize Fallback (Groq)
    if groq_api_key:
        fallback_llm = ChatGroq(
            model=settings.model,
            temperature=settings.temperature,
            max_tokens=settings.max_tokens,
            timeout=settings.timeout_seconds,
            max_retries=settings.max_retries,
            api_key=groq_api_key,
        )

    # 3. Chain them: If Gemini fails/errors, LangChain automatically tries Groq
    if fallback_llm:
        return primary_llm.with_fallbacks([fallback_llm])
    
    return primary_llm


@asynccontextmanager
async def checkpoint_context(config: Settings):
    if not config.langgraph_checkpoint_enabled:
        yield None
        return
    try:
        from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
    except ImportError as exc:
        raise AIConfigurationError("langgraph-checkpoint-postgres is not installed.") from exc

    async with AsyncPostgresSaver.from_conn_string(_checkpoint_dsn(config.sync_database_url)) as saver:
        yield saver