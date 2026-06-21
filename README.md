# ai_hackathon

# CareBridge Navigator

CareBridge Navigator helps caregivers after stroke discharge understand possible benefits and support options, what information is missing, and what steps to take next.

This repository is currently at **Phase 0 - Repository Setup**. The goal is a runnable local foundation: React/Vite frontend, FastAPI backend, PostgreSQL with pgvector support, environment templates, and setup documentation. Intake, recommendations, RAG, LangGraph, and Module 2 integration start in later phases.

## Source Documents

- Scope and phases: `PROJECT_PLAN.md`
- API contract: `API_CONTRACT.md`
- UI direction: `DESIGN.md`
- Architecture: `docs/architecture.md`
- Database model: `docs/database-schema.md`

## Prerequisites

- Node.js 20+
- npm
- Python 3.11+
- Docker and Docker Compose

## Environment

Copy the example files before running local services:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Do not commit real secrets or patient data.

## Frontend

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Frontend URL: `http://127.0.0.1:5173`

Build check:

```bash
npm --prefix frontend run build
```

Test check:

```bash
npm --prefix frontend test -- --run
```

## Backend

```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
backend/.venv/bin/python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

Backend URL: `http://127.0.0.1:8000`

Health check:

```bash
curl http://127.0.0.1:8000/api/v1/health
```

Test check:

```bash
backend/.venv/bin/pytest backend/tests -q
```

## PostgreSQL

```bash
docker compose up -d postgres
docker compose ps
```

Default local connection:

```text
postgresql+psycopg://carebridge:carebridge_dev@localhost:5432/carebridge
```

The compose file uses a pgvector-ready PostgreSQL image so later RAG phases can store embeddings without replacing the database.

## Phase 0 Stop Point

Phase 0 is complete when the frontend starts, the backend starts, PostgreSQL runs locally, and the health endpoint responds. Product flow work starts in Phase 1.
