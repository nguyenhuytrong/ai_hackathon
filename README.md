# CareBridge Navigator

CareBridge Navigator is a hackathon MVP that helps caregivers after stroke discharge explore possible support options, source-backed evidence, missing information, and practical next steps.

The app combines:

- Guided caregiver intake
- Deterministic support matching
- RAG source ingestion and evidence search
- Action-plan generation
- Optional Rehab Snapshot mobility observations
- Responsible AI guardrails that avoid final eligibility, diagnosis, or treatment claims

## Project Structure

```text
.
├── backend/          # FastAPI, SQLAlchemy, PostgreSQL/SQLite test support
├── frontend/         # Vite + React app
├── docs/             # Architecture and database notes
├── API_CONTRACT.md   # API shapes and route contract
├── DESIGN.md         # UI direction
├── PROJECT_PLAN.md   # Phase roadmap
└── docker-compose.yml
```

## Prerequisites

- Node.js 20+
- npm
- Python 3.11+
- Docker Desktop or Docker Compose

## First-Time Setup

Run these commands from the repository root.

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Use the root `.env` for Docker Compose database defaults, `backend/.env` for FastAPI settings, and `frontend/.env` for Vite settings.

If you do not have a Groq key, keep Rehab Snapshot LLM calls disabled in `backend/.env`:

```env
REHAB_SNAPSHOT_LLM_ENABLED=false
GROQ_API_KEY=
```

The deterministic Rehab Snapshot fallback works without external AI credentials.

## Run Locally

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Create the backend virtual environment and install Python dependencies:

```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
```

Start the backend:

```bash
backend/.venv/bin/python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

In a second terminal, install and start the frontend:

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Open:

```text
http://127.0.0.1:5173
```

Backend API docs:

```text
http://127.0.0.1:8000/docs
```

## Demo Flow

1. Open the frontend.
2. Click **Load Demo Persona**.
3. Open **Benefits** to generate support recommendations.
4. Review source-backed evidence and missing information.
5. Open **Plan** for caregiver next steps and questions to ask.
6. Open **Rehab Snapshot** to run the optional mobility flow.
7. Return to **Benefits** or **Plan** after saving Rehab Snapshot observations.

Demo persona:

- Caregiver: John
- Care recipient: Mother
- Recent discharge
- Montgomery County, Ohio
- Medicaid
- No vehicle
- Mobility concern
- Elevated caregiver burden

## Main Routes

Frontend:

- `/`
- `/intake`
- `/benefits`
- `/plan`
- `/profile`
- `/rehab-snapshot`

Backend:

- `GET /api/v1/health`
- `POST /api/v1/sessions`
- `POST /api/v1/sessions/demo`
- `GET /api/v1/sessions/{sessionId}`
- `PATCH /api/v1/sessions/{sessionId}/intake`
- `POST /api/v1/sessions/{sessionId}/recommendations`
- `GET /api/v1/sessions/{sessionId}/recommendations/latest`
- `GET /api/v1/resources`
- `GET /api/v1/resources/{resourceId}`
- `POST /api/v1/rag/ingest`
- `POST /api/v1/rag/search`
- `GET /api/v1/sources/{sourceId}`
- `POST /api/v1/rehab-snapshot/report`

## RAG Source Setup

The app can ingest checked-in trusted source metadata from:

```text
backend/app/rag/ingestion/sources.json
```

With the backend running, ingest sources:

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/rag/ingest?dryRun=false"
```

Search evidence:

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/rag/search" \
  -H "Content-Type: application/json" \
  -d '{"query":"transportation support after stroke discharge","category":"transportation","topK":3}'
```

Tests and default local runs use fake deterministic embeddings, so no embedding API key is required.

## Verification

Backend tests:

```bash
backend/.venv/bin/python -m pytest backend/tests -q
```

Frontend build:

```bash
npm --prefix frontend run build
```

Frontend tests:

```bash
npm --prefix frontend test -- --run
```

## Troubleshooting

### Frontend cannot reach backend

Make sure `frontend/.env` has:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Restart the frontend after changing Vite environment variables.

### Backend cannot connect to PostgreSQL

Start the database:

```bash
docker compose up -d postgres
docker compose ps
```

Expected default database URL:

```text
postgresql+psycopg://carebridge:carebridge_dev@localhost:5432/carebridge
```

### Rehab Snapshot LLM calls fail

The app falls back to deterministic report generation when Groq fails. For credential-free local demos, use:

```env
REHAB_SNAPSHOT_LLM_ENABLED=false
GROQ_API_KEY=
```

### Port already in use

Backend default port:

```text
8000
```

Frontend default port:

```text
5173
```

Stop the existing process or change the command port manually.

## Responsible AI Boundaries

CareBridge does not:

- Determine final eligibility
- Provide medical advice
- Diagnose stroke severity
- Recommend treatment changes
- Replace healthcare professionals, insurers, social workers, or program administrators

Recommendations are phrased as possible matches, discussion prompts, missing information, and next steps.
