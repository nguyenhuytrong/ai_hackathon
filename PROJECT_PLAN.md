# CareBridge Navigator — Project Plan

## 1. Project Overview

**CareBridge Navigator** is an AI-powered benefits and support navigation tool for caregivers helping a loved one recover at home after a stroke-related hospital discharge.

The project is built for an AI Hackathon under the direction:

> Help people understand whether they may qualify for a public support program — and what steps to take next.

CareBridge focuses on the caregiver experience after discharge, when families often receive paperwork, medication instructions, rehabilitation guidance, and follow-up responsibilities but do not know which supports may be available or what to do first.

CareBridge does not diagnose stroke, prescribe treatment, or determine final eligibility. It helps caregivers:

- Answer guided intake questions.
- Understand possible support pathways.
- Interpret eligibility factors in plain language.
- Identify missing information.
- Review evidence from trusted sources.
- Generate a practical action plan.
- Prepare questions for doctors, therapists, social workers, and insurance providers.

---

## 2. Project Goals

### Primary Goals

- Build a polished full-stack AI product using React, FastAPI, PostgreSQL, and RAG.
- Make CareBridge clearly feel like a **Benefits Navigator**, not a general rehab app.
- Create a guided intake experience that asks relevant questions.
- Use simple rule matching to identify possible support categories.
- Use RAG to retrieve evidence from trusted PDFs/web sources.
- Use an LLM to explain recommendations in plain language.
- Return source-grounded recommendations with citations.
- Generate an actionable care/support plan.
- Show missing information instead of overclaiming eligibility.
- Integrate Module 2 Rehab Snapshot as a supporting signal, not the core product.
- Create a demo flow that judges understand within seconds.

### Secondary Goals

- Demonstrate LangChain and LangGraph usage.
- Demonstrate a real RAG pipeline:
  - document ingestion
  - chunking
  - embeddings
  - vector search
  - evidence retrieval
  - grounded generation
- Build a clean UI using shadcn/ui and Tailwind CSS.
- Keep the architecture simple enough for hackathon speed.
- Prepare the project for future expansion after the hackathon.

---

## 3. Non-Goals

The MVP should avoid unnecessary complexity.

Do not focus on:

- Microservices
- Kubernetes
- Kafka
- Redis
- Complex authentication
- Full production security
- Full hospital integration
- Insurance API integration
- Real benefit application submission
- Medical diagnosis
- Medication management
- Clinical scoring
- Real-time notifications
- Complex DevOps
- Heavy automated testing
- Full admin dashboard
- Full patient portal

These can be considered after the core product works.

---

## 4. Target Users

### Primary User — Caregiver

Example:

John is a 26-year-old caregiver whose mother was discharged home after a stroke five days ago. He works during the day, has limited transportation, is unsure whether rehab has been scheduled, and does not know which supports may be available.

The caregiver needs to know:

- What should I do first?
- What support may apply to my situation?
- What information is missing?
- Who should I call?
- What documents should I prepare?
- What questions should I ask?

### Secondary User — Stroke Survivor

The stroke survivor may have mobility limitations, fatigue, difficulty attending appointments, or need rehabilitation follow-up.

The product is caregiver-centered but should use language that is safe, respectful, and easy to understand.

### Stakeholders

- Doctor
- Physical therapist
- Occupational therapist
- Nurse / discharge planner
- Social worker / care coordinator
- Insurance provider
- Local transportation program
- Community or nonprofit support organization

---

## 5. Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod
- Lucide React icons

### Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- PostgreSQL
- Alembic optional
- Uvicorn

### AI / RAG

- LangChain
- LangGraph
- LLM API provider
- Embedding API provider
- PostgreSQL + pgvector for MVP
- Qdrant optional stretch goal
- PDF loader / PyMuPDF
- Web loader
- Recursive text splitter

### Dev / Tooling

- Docker
- Docker Compose
- npm
- Python virtual environment
- GitHub

---

## 6. High-Level Architecture

CareBridge starts as a simple full-stack modular application.

```text
React Frontend
    ↓ REST/JSON
FastAPI Backend
    ↓
PostgreSQL
    ↓
pgvector document chunks
    ↓
LLM + Embedding APIs
```

More detail is documented in:

```text
docs/architecture.md
```

---

## 7. MVP Scope Decisions

- Start with one frontend app and one backend app.
- Use one PostgreSQL database.
- Use PostgreSQL + pgvector for vector storage in MVP.
- Use Qdrant only if the team has extra time.
- Use LangChain for document loading, chunking, embeddings, and retrieval.
- Use LangGraph for the recommendation workflow.
- Use simple deterministic rule matching before calling the LLM.
- Use RAG as an evidence engine, not as the final eligibility decision-maker.
- Use one demo persona and one target geography.
- Use 5–10 high-quality sources instead of many low-quality sources.
- Use “may qualify” and “possible match”, never “you qualify”.
- Module 2 Rehab Snapshot is optional and only updates support priorities.

---

## 8. Core MVP Features

### Guided Intake

- Collect discharge timing.
- Collect mobility status.
- Collect transportation barriers.
- Collect insurance type.
- Collect caregiver work/burden status.
- Collect state/county.
- Collect biggest current challenge.
- Show an “AI is considering” panel with visible factors.

### Recommendation Generation

- Run simple rule matching.
- Generate possible support matches.
- Retrieve evidence from trusted documents.
- Generate structured recommendations.
- Show:
  - match status
  - why this may fit
  - missing information
  - documents to prepare
  - next steps
  - source evidence

### Benefits / Resource Detail

- Show a resource or support pathway.
- Explain why it may fit.
- Show eligibility factors.
- Show missing information.
- Show steps to explore the support.
- Show source citations.

### Action Plan

- Generate next steps for the week.
- Group tasks by priority.
- Provide checklists.
- Provide questions to ask at the next appointment.

### RAG Source Viewer

- Show source title.
- Show source type.
- Show source URL.
- Show page number if PDF.
- Show relevant excerpt.
- Show authority level.

### Module 2 Integration

- Accept Rehab Snapshot summary.
- Save mobility concern and observations.
- Regenerate recommendations if needed.
- Use Rehab Snapshot only as a support signal.

### Responsible AI

- Display disclaimer.
- Avoid medical diagnosis.
- Avoid final eligibility claims.
- Use source-grounded explanations.

---

## 9. Advanced Features Optional

Only add after MVP is stable:

### RAG Improvements

- Hybrid search.
- Reranking.
- Query rewriting.
- Parent-child chunking.
- Source quality scoring.
- RAG evaluation dashboard.
- Document upload for discharge papers.

### Product Improvements

- Authentication.
- Saved plans.
- Multi-caregiver collaboration.
- Printable PDF summary.
- Email export.
- Appointment calendar.
- Notifications.
- Full admin source management.

### Technical Improvements

- Qdrant vector database.
- OpenTelemetry.
- CI/CD.
- More complete tests.
- Deployment pipeline.
- Authentication and protected accounts.

---

## 10. Critical Product Rules

- CareBridge is a Benefits Navigator.
- Rehab Snapshot is supporting context, not the main product.
- Do not build a full-screen chatbot as the main UI.
- Do not present a resource list without interpretation.
- Every recommendation should answer:
  1. Why this may fit.
  2. What is still missing.
  3. What to prepare.
  4. What to do next.
  5. Which source supports this.
- Never say “you qualify”.
- Do not invent sources or program details.
- If evidence is insufficient, say so clearly.

---

## 11. Development Phases

### Phase 0 — Repository Setup

Goals:

- Create frontend React/Vite app.
- Create backend FastAPI app.
- Add PostgreSQL configuration.
- Add documentation files.
- Add Docker Compose skeleton.

Deliverables:

- Frontend starts locally.
- Backend starts locally.
- PostgreSQL runs locally.
- Documentation skeleton exists.

### Phase 1 — Product Flow and UI Skeleton

Goals:

- Build core routes.
- Build layout and navigation.
- Build Home/Landing page.
- Build Guided Intake page.
- Build placeholder recommendations page.
- Build placeholder Action Plan page.

Deliverables:

- User can move through the core screens.
- UI already communicates “Benefits Navigator”.
- Demo persona can be loaded with mock data.

### Phase 2 — Intake and Session Backend

Goals:

- Create session API.
- Save intake profile.
- Load session profile.
- Add demo session endpoint.

Deliverables:

- Frontend intake saves to backend.
- Demo persona can be created from backend.
- Profile JSON is stored in PostgreSQL.

### Phase 3 — Resource Seed Data and Rule Matching

Goals:

- Create resource records.
- Create eligibility/support rules.
- Implement simple deterministic matching.
- Return mock recommendation JSON without LLM first.

Deliverables:

- Transportation barrier creates transportation support match.
- Mobility issue creates rehab/home-health support match.
- Caregiver burden creates caregiver support match.
- Missing information is shown.

### Phase 4 — RAG Ingestion

Goals:

- Collect 5–10 trusted sources.
- Load PDFs/webpages.
- Chunk documents.
- Generate embeddings.
- Store chunks and vectors.
- Save source metadata.

Deliverables:

- Ingestion script runs.
- Chunks are searchable.
- Source metadata is available for citations.

### Phase 5 — RAG Search and Source Viewer

Goals:

- Add RAG search endpoint.
- Retrieve relevant chunks by query and metadata.
- Show source viewer on frontend.

Deliverables:

- User can see retrieved source evidence.
- Recommendation cards can display source snippets.
- RAG pipeline is visible in the demo.

### Phase 6 — LangGraph Recommendation Workflow

Goals:

- Build recommendation graph:
  1. rule matching
  2. retrieval query generation
  3. evidence retrieval
  4. evidence grading
  5. recommendation generation
  6. action plan generation
- Return structured JSON.

Deliverables:

- Recommendations are generated using profile + rules + RAG evidence.
- LLM output includes source IDs.
- Frontend renders AI-generated recommendations.

### Phase 7 — Resource Detail and Action Plan Polish

Goals:

- Build detailed resource pages.
- Build action checklist.
- Build questions-to-ask page.
- Add “why recommended” explainability view.

Deliverables:

- User can inspect each recommendation.
- User can understand why it was recommended.
- User receives a practical next-step plan.

### Phase 8 — Module 2 Integration

Goals:

- Add Rehab Snapshot endpoint.
- Accept mobility concern and observations.
- Update support priorities.
- Show “Care Plan Updated with Rehab Data”.

Deliverables:

- Module 2 can send summary to Module 1.
- Rehab Snapshot updates recommendation priority without becoming the core product.

### Phase 9 — Demo Polish

Goals:

- Improve visual hierarchy.
- Add loading states.
- Add empty states.
- Add responsible AI banner.
- Add final demo script.
- Prepare stable local run.

Deliverables:

- Judges can understand the product quickly.
- Full demo flow works reliably.
- Product feels polished and coherent.

---

## 12. Recommended Demo Flow

```text
Home
  ↓
Guided Intake
  ↓
Potential Support Matches
  ↓
Why Recommended / Source Evidence
  ↓
Resource Detail
  ↓
Action Plan
  ↓
Optional Rehab Snapshot update
```

Demo message:

> CareBridge asks relevant questions, retrieves evidence from trusted sources, interprets possible support pathways, and gives caregivers a clear action plan.

---

## 13. Definition of Done for MVP

Frontend:

- Home/Landing page exists.
- Guided Intake exists.
- Recommendation cards exist.
- Resource Detail exists.
- Action Plan exists.
- Source Viewer exists.
- Responsible AI banner exists.

Backend:

- Session API works.
- Intake API works.
- Recommendation API works.
- Resource API works.
- RAG Search API works.
- Rehab Snapshot API works.

RAG:

- Documents can be ingested.
- Chunks are embedded.
- Chunks can be retrieved.
- Recommendations include source evidence.
- LLM does not invent unsupported claims.

Product:

- User sees possible support matches.
- User sees why support may fit.
- User sees missing information.
- User sees next steps.
- User sees citations.
- User understands CareBridge is not making final eligibility or medical decisions.
