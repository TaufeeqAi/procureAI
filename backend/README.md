# Elecon Procurement API — (FastAPI + PostgreSQL)

Replaces the frontend's mock persistence layer while preserving its
conceptual model — see `docs/architecture/backend-contract-parity.md` for
the rule this whole backend is built around.

## Stack

FastAPI · SQLAlchemy 2.0 (async) · PostgreSQL 17 · asyncpg · Alembic ·
Pydantic v2. Every version in `pyproject.toml` was checked against PyPI /
the project's own release page this session — see `PHASE-3-SUMMARY.md` §
Toolchain for exactly which ones and the few conservative-lower-bound
exceptions.

## Local setup (Docker — recommended)

```bash
docker compose up --build
```

This starts Postgres, runs `alembic upgrade head`, seeds the hero
scenario, and starts the API on `http://localhost:8000`. Interactive docs
at `http://localhost:8000/docs`.

## Local setup (without Docker)

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

cp .env.example .env   # edit DATABASE_URL if your Postgres isn't local:5432

alembic upgrade head
python -m seed.seed
uvicorn app.main:app --reload
```

## Running tests

```bash
pytest
```

Tests run against an in-memory SQLite database, not a live Postgres — see
`tests/conftest.py`'s module docstring for why that's a deliberate choice
and what it does and doesn't verify.

## Connecting the frontend

Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1` in the
frontend's `.env.local`. No frontend code changes are required beyond
that — see `docs/architecture/backend-contract-parity.md`.

## Project layout

```
backend/
├── app/
│   ├── main.py              FastAPI app, CORS, exception handlers, lifespan
│   ├── api/                 Route handlers — one file per resource
│   ├── core/                Config, database engine/session, exceptions, logging
│   ├── models/               SQLAlchemy ORM models
│   ├── schemas/              Pydantic schemas (CamelModel — see common.py)
│   ├── services/              Business logic, one file per resource
│   ├── calculations/          Deterministic pricing (ported from the frontend)
│   └── integrations/           Reserved for Phase 5+ (email, ERP)
├── alembic/                  Async migration environment + versions/
├── seed/                     seed.py — the hero scenario as real rows
└── tests/                    pytest — api/, services/, calculations/
```
