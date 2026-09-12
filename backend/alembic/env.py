import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# Importing app.models (not just app.core.database) is what populates
# Base.metadata with every table — see app/models/__init__.py's docstring
# for why this import, even though nothing below uses the names directly,
# is load-bearing for autogenerate.
import app.models  # noqa: F401
from alembic import context
from app.core.config import get_settings
from app.core.database import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# The database URL comes from application settings (which reads .env),
# not from a URL hardcoded in alembic.ini — one source of truth for where
# the database lives, whether you're running the app or running a
# migration.
settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.database_url)


def run_migrations_offline() -> None:
    """`alembic upgrade head --sql` — emits SQL without a live DB
    connection, for review or for applying via a separate deploy step."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """
    Alembic's migration runner is synchronous; asyncpg (this project's
    runtime driver) has no sync mode. The standard bridge — confirmed
    against Alembic's own current documentation, not assumed from
    training data — is `async_engine_from_config` plus
    `connection.run_sync(...)`: open one async connection, then run the
    actual (synchronous) migration logic through it via `run_sync`.
    `NullPool` avoids holding a pooled connection open for a one-shot
    migration process.
    """
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
