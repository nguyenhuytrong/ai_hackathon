# CareBridge Navigator — Architecture Documentation

## 1. Architecture Goal

CareBridge Navigator is designed as a simple, high-quality hackathon product with a clean modular architecture.

The architecture should be simple enough to build quickly, but serious enough to demonstrate real AI engineering:

- Guided intake
- Rule-based support matching
- RAG evidence retrieval
- LLM-generated explanations
- Action plan generation
- Clear frontend/backend separation
- Responsible AI boundaries

CareBridge should start as a modular full-stack application, not microservices.

---

## 2. High-Level System Architecture

```text
Client Browser
    ↓
React Frontend
    ↓ REST/JSON over HTTP
FastAPI Backend
    ↓
PostgreSQL Database
    ↓
pgvector document embeddings
    ↓
LLM API + Embedding API
```

Optional stretch goal:

```text
FastAPI Backend
    ↓
Qdrant Vector Database
```

---

## 3. Frontend Architecture

The frontend is built with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui.

Recommended flow:

```text
Route/Page Component
    ↓
Feature Component
    ↓
Shared UI Component
    ↓
API Client
    ↓
FastAPI Backend
```

### Page Components

Route-level screens.

Examples:

- Home Page
- Guided Intake Page
- Recommendation Page
- Explainability Page
- Resource Detail Page
- Action Plan Page
- Questions to Ask Page
- Profile Page optional

### Feature Components

Feature-specific sections.

Examples:

- Intake step card
- AI consideration panel
- Recommendation card
- Match status badge
- Source evidence card
- Action checklist
- Question group
- Rehab snapshot summary card

### Shared UI Components

Reusable presentational components.

Examples:

- Card
- Badge
- Button
- Loading state
- Empty state
- Error state
- Source modal
- Responsible AI banner

### API Layer

Frontend API functions should live in `src/api`.

Examples:

- `sessions.api.ts`
- `recommendations.api.ts`
- `resources.api.ts`
- `rag.api.ts`
- `rehab.api.ts`

### State Management

Use:

- TanStack Query for server state.
- React Hook Form for intake form state.
- Zod for frontend validation.
- Local component state for UI-only state.

Do not add Redux for the MVP.

---

## 4. Backend Architecture

The backend uses FastAPI.

Recommended flow:

```text
Router
    ↓
Service
    ↓
Repository
    ↓
Database
```

### Router Layer

Routers handle HTTP request/response concerns.

Responsibilities:

- Receive request schemas.
- Validate request bodies through Pydantic.
- Call service methods.
- Return response schemas.
- Avoid business logic.

### Service Layer

Services contain application logic.

Responsibilities:

- Build or update intake profile.
- Run rule matching.
- Call RAG retrieval.
- Run LangGraph workflow.
- Validate LLM output.
- Build recommendation response.
- Store recommendation runs.
- Handle fallback behavior.

### Repository Layer

Repositories handle database access.

Responsibilities:

- Create/read sessions.
- Create/read resources.
- Create/read source documents.
- Create/read chunks.
- Save recommendation runs.

### Schema Layer

Pydantic schemas define API request and response shapes.

Examples:

- `SessionResponse`
- `IntakeProfile`
- `RecommendationResponse`
- `ResourceDetailResponse`
- `RagSearchRequest`
- `RehabSnapshotRequest`

---

## 5. Backend Module Structure

Recommended folder structure:

```text
backend/
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   └── v1/
│   │       ├── router.py
│   │       ├── sessions.py
│   │       ├── recommendations.py
│   │       ├── resources.py
│   │       ├── rag.py
│   │       ├── rehab_snapshot.py
│   │       └── health.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── errors.py
│   │   └── logging.py
│   │
│   ├── db/
│   │   ├── session.py
│   │   ├── models.py
│   │   └── repositories.py
│   │
│   ├── schemas/
│   │   ├── common.py
│   │   ├── session.py
│   │   ├── intake.py
│   │   ├── recommendation.py
│   │   ├── resource.py
│   │   ├── rag.py
│   │   └── rehab.py
│   │
│   ├── services/
│   │   ├── session_service.py
│   │   ├── intake_service.py
│   │   ├── eligibility_service.py
│   │   ├── recommendation_service.py
│   │   ├── action_plan_service.py
│   │   ├── resource_service.py
│   │   └── rehab_adapter.py
│   │
│   ├── rag/
│   │   ├── ingestion/
│   │   ├── retrieval/
│   │   ├── generation/
│   │   ├── graph/
│   │   └── prompts/
│   │
│   └── seed/
│       └── seed_resources.py
```

---

## 6. Core Backend Modules

### Session Module

Responsibilities:

- Create session.
- Load session.
- Update intake profile.
- Create demo session.
- Store profile JSON.

### Intake Module

Responsibilities:

- Validate intake fields.
- Normalize profile data.
- Prepare profile for rule matching.
- Support `not_sure` values.

### Resource Module

Responsibilities:

- Store support resources.
- Store resource categories.
- Store basic eligibility factors.
- Store documents to prepare.
- Store official source metadata.
- Return resource details.

### Eligibility / Rule Matching Module

Responsibilities:

- Run deterministic rules over intake profile.
- Identify possible support categories.
- Produce match status.
- Produce matched factors.
- Produce missing information.
- Avoid final eligibility claims.

Example:

```text
transportation = no_vehicle
    ↓
Transportation Assistance = possible_match
```

### RAG Module

Responsibilities:

- Load trusted documents.
- Chunk documents.
- Generate embeddings.
- Store chunks.
- Retrieve evidence.
- Return source excerpts.
- Provide citations for recommendations.

### LangGraph Recommendation Module

Responsibilities:

- Orchestrate the AI workflow.
- Combine profile + rule results + retrieved evidence.
- Generate structured recommendation JSON.
- Generate action plan and questions.
- Apply responsible AI language constraints.

### Rehab Adapter Module

Responsibilities:

- Accept Module 2 Rehab Snapshot summary.
- Store mobility concern.
- Add functional signal to profile.
- Recompute recommendations if needed.
- Avoid clinical diagnosis.

---

## 7. RAG Architecture

RAG pipeline:

```text
Trusted PDF / Webpage
    ↓
Document Loader
    ↓
Text Cleaning
    ↓
Text Chunking
    ↓
Embedding Generation
    ↓
Vector Storage
    ↓
Retriever
    ↓
Evidence Formatter
    ↓
LLM Prompt
    ↓
Grounded Recommendation
```

### Document Loaders

Use LangChain loaders or direct libraries:

- PDF loader / PyMuPDF
- Web loader
- Manual markdown/text loader for curated sources

### Chunking

Use recursive chunking for MVP.

Recommended starting settings:

```text
chunk_size: 800
chunk_overlap: 120
```

Each chunk must retain metadata.

### Metadata

Every chunk should include:

- chunk ID
- source document ID
- source title
- source URL
- source type
- page number if available
- category
- state
- county
- authority level
- resource ID if linked

### Retrieval

Initial MVP:

```text
Query
    ↓
Embedding
    ↓
Vector similarity search
    ↓
Top K chunks
    ↓
Context builder
```

Optional improvements:

- Metadata filtering.
- Query rewriting.
- Hybrid search.
- Reranking.

---

## 8. LangGraph Recommendation Flow

Recommended graph:

```text
BuildProfileSummary
    ↓
RunRuleMatching
    ↓
GenerateRetrievalQueries
    ↓
RetrieveEvidence
    ↓
GradeEvidence
    ↓
GenerateRecommendations
    ↓
GenerateActionPlan
    ↓
ReturnFinalResponse
```

### Node 1 — Build Profile Summary

Input:

- intake profile
- optional rehab snapshot

Output:

- normalized profile summary

### Node 2 — Run Rule Matching

Input:

- profile summary

Output:

- possible support matches
- matched factors
- missing information

### Node 3 — Generate Retrieval Queries

Input:

- profile
- rule matches

Output:

- search queries for each support category

### Node 4 — Retrieve Evidence

Input:

- queries
- metadata filters

Output:

- source chunks

### Node 5 — Grade Evidence

Input:

- retrieved chunks

Output:

- `sufficient`, `partial`, or `insufficient`

### Node 6 — Generate Recommendations

Input:

- profile
- rule matches
- evidence chunks

Output:

- recommendation JSON

### Node 7 — Generate Action Plan

Input:

- recommendations

Output:

- prioritized checklist and questions

---

## 9. Recommendation Flow

```text
User completes intake
    ↓
Frontend calls POST /sessions/{id}/recommendations
    ↓
Backend loads profile
    ↓
Rule engine identifies possible support matches
    ↓
RAG retrieves relevant evidence
    ↓
LLM generates grounded recommendation JSON
    ↓
Backend validates output
    ↓
Backend saves recommendation run
    ↓
Frontend displays support plan
```

Important:

- Rule engine produces candidate matches.
- RAG provides evidence.
- LLM explains and generates action steps.
- Backend validates before returning.

---

## 10. Module 2 Integration Flow

```text
Rehab Snapshot module completes assessment
    ↓
Module 2 sends summary to Module 1 API
    ↓
CareBridge stores mobility concern and observations
    ↓
CareBridge updates profile signals
    ↓
Recommendation workflow can be re-run
    ↓
Care plan shows what changed
```

Rules:

- Rehab Snapshot is optional.
- Rehab Snapshot is not a medical diagnosis.
- Rehab Snapshot should not directly determine eligibility.
- Rehab Snapshot may increase priority for rehab follow-up, home health discussion, or transportation support.

---

## 11. Responsible AI Architecture

CareBridge must include safeguards:

- No final eligibility decision.
- No medical diagnosis.
- No medication changes.
- No invented sources.
- No raw chain-of-thought exposure.
- No unsupported claims.
- Source evidence should be shown when available.
- Missing information should be shown clearly.

LLM prompts must instruct:

- Use only provided profile, rules, and retrieved evidence.
- Say when evidence is insufficient.
- Use “may qualify” or “may benefit”.
- Never say “you qualify”.

---

## 12. Error Handling Architecture

Use consistent error responses from `API_CONTRACT.md`.

Common cases:

- Session not found.
- Invalid intake value.
- No recommendation available.
- RAG retrieval failed.
- LLM provider unavailable.
- Invalid LLM JSON output.
- Source not found.

For hackathon MVP:

- Show friendly frontend error states.
- Provide deterministic fallback when LLM fails.
- Do not overbuild global exception infrastructure, but keep errors consistent.

---

## 13. Future Architecture Direction

After MVP:

- Add authentication.
- Add saved caregiver accounts.
- Add user-uploaded discharge documents.
- Add source admin UI.
- Add Qdrant or a dedicated vector DB.
- Add hybrid search and reranking.
- Add RAG evaluation dashboard.
- Add PDF export.
- Add notification reminders.
- Add stronger privacy/security controls.
