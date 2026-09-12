# Elecon Procurement Intelligence & Orchestration Platform

AI-assisted procurement workspace for Elecon purchase officers — wraps the
existing PR/ERP/procurement system with an intelligence and orchestration
layer, rather than replacing it. 

**This repository currently contains Phases 0–3**: a fully navigable,
type-safe frontend with realistic mock data and AI-interaction
choreography, plus a real FastAPI + PostgreSQL backend
verified against a genuine running Postgres instance. The
frontend is not yet wired to call the backend 

## Repository layout

```
elecon-procurement-ai/
├── frontend/              Next.js 16.3.4 + TypeScript + Tailwind v4 
│   └── ...                 See PHASE-0/1/2-SUMMARY.md for details
├── backend/                FastAPI + SQLAlchemy 2.0 (async) + PostgreSQL 
│   ├── app/
│   │   ├── main.py           FastAPI app, CORS, exception handlers
│   │   ├── api/               12 routers, one per resource
│   │   ├── core/               Config, DB engine/session, exceptions, logging
│   │   ├── models/              18 SQLAlchemy models
│   │   ├── schemas/              Pydantic schemas (CamelModel — see common.py)
│   │   ├── services/              Business logic, one file per resource
│   │   └── calculations/           Deterministic pricing (ported from the frontend)
│   ├── alembic/                Async migration environment
│   ├── seed/                   The hero scenario as real database rows
│   └── tests/                  13 passing tests (api/, services/, calculations/)
└── docs/
    └── architecture/        Design system, IA, state machines, AI UX,
                             AI interaction layer, backend contract parity,
                             roadmap, user journey, and decision records
```

## Getting started

**Frontend:**
```bash
cd frontend && npm install && npm run dev   # http://localhost:3000
```

**Backend (Docker — recommended):**
```bash
cd backend && docker compose up --build     # http://localhost:8000/docs
```

**Backend (manual):**
```bash
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
alembic upgrade head
python -m seed.seed
uvicorn app.main:app --reload
```


