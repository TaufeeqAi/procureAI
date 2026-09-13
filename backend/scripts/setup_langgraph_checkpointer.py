from __future__ import annotations

import asyncio
import re
import sys

from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from app.core.config import get_settings


def checkpoint_dsn(sync_database_url: str) -> str:
    return re.sub(r"^postgresql\+psycopg://", "postgresql://", sync_database_url)


async def main() -> None:
    settings = get_settings()
    dsn = checkpoint_dsn(settings.sync_database_url)
    async with AsyncPostgresSaver.from_conn_string(dsn) as saver:
        await saver.setup()
    print("LangGraph checkpoint tables are ready.")


if __name__ == "__main__":
    # Windows requires SelectorEventLoop for psycopg async operations
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    asyncio.run(main())