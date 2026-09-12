from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

# Pool settings sized for a single-instance demo/staging deployment, not a
# high-concurrency production fleet — `pool_pre_ping` matters more than the
# exact pool size here, since it's what keeps a long-idle connection from
# surfacing as a confusing mid-request error after Postgres or a load
# balancer recycles it.
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Every ORM model in app/models/ inherits from this. A single shared
    Base is what lets Alembic's autogenerate (and `Base.metadata` in
    alembic/env.py) see every table in one place."""


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — one session per request, always closed, and
    rolled back on an unhandled exception rather than left dangling.
    `expire_on_commit=False` above means a schema object returned from a
    service function stays readable after the session closes, which
    matters because our services return ORM objects that Pydantic schemas
    (with `from_attributes=True`) then serialize after the request's
    session has already been torn down."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
