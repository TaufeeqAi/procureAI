"""
Tests run against an in-memory SQLite database via aiosqlite, not a real
Postgres instance — a deliberate choice, not an oversight. This app's
model layer uses only cross-dialect SQLAlchemy constructs (generic `JSON`
columns rather than Postgres-specific `JSONB`, standard `Enum` rather than
a Postgres-only enum feature — see the JSON-column rationale in
app/models/supplier.py), specifically so this substitution is safe. What
this test suite does NOT verify: Postgres-specific behavior (native ENUM
type creation, JSONB containment queries if those are ever added). A real
Postgres integration check is `docker compose up` plus the manual
verification steps in README.md, not something to fake through a slower,
more fragile CI dependency on a live Postgres container.
"""

import asyncio
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    # StaticPool + a single shared connection is what makes an in-memory
    # SQLite database visible across the multiple AsyncSession instances
    # a single test can create (the app's own `get_db` dependency opens
    # its own session per request) — without it, each new connection to
    # `:memory:` would see an empty, unrelated database.
    engine = create_async_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
