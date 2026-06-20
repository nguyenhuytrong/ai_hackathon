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

Implemented scope:

- Backend exposes `POST /api/v1/rag/search` with query embedding, metadata filters, Python-side scoring, and citation-ready chunk results.
- Backend exposes `GET /api/v1/sources/{sourceId}` for source metadata and stored chunks.
- Recommendation generation can request RAG evidence and attach retrieved source snippets with `evidenceStatus: "partial"` when chunks are found.
- Frontend requests RAG evidence during recommendation generation, renders snippets in support cards, links to `/sources/:sourceId`, and shows a compact Evidence Search panel on Benefits.

### Phase 6 — LangGraph Recommendation Workflow

Summary:

Build the first LangGraph-orchestrated recommendation workflow while preserving the Phase 5 public API and frontend response shape. The graph should combine the saved intake profile, deterministic rule matches, retrieved evidence chunks, evidence grading, and an LLM-backed structured JSON generation step with a deterministic fallback.

Phase 6 should not add chatbot behavior, user-authenticated accounts, Rehab Snapshot logic, resource admin screens, new recommendation endpoints, or invented sources. The rule engine still decides candidate support pathways; the LLM only rewrites/explains and organizes results using provided profile, rule matches, and retrieved evidence.

Key changes:

- Add minimal backend AI workflow dependencies if absent:
  - `langgraph`
  - `langchain-core`
  - optional provider SDK only behind settings if the chosen provider requires it.
- Add backend settings:
  - `LLM_PROVIDER=fake`
  - `LLM_MODEL`
  - `LLM_TEMPERATURE=0`
  - optional provider API key env used only when provider is not `fake`.
- Add an LLM adapter layer:
  - default `fake` provider for tests and credential-free demos.
  - optional real provider with timeout/error handling.
  - structured response contract returning only validated JSON-compatible data.
- Split recommendation orchestration into focused modules:
  - keep deterministic matching reusable from the existing `RecommendationService`.
  - add retrieval query generation from profile/rule-match/resource context.
  - reuse Phase 5 `RagSearchService` for evidence retrieval.
  - add evidence grading with deterministic rules: `partial` when relevant chunks exist, `insufficient` when no relevant chunks exist, and `sufficient` reserved for future stricter criteria.
  - add LangGraph nodes for profile summary, rule matching, query generation, evidence retrieval, evidence grading, recommendation JSON generation, action plan generation, validation, and fallback.
- Preserve existing endpoint behavior:
  - `POST /api/v1/sessions/{sessionId}/recommendations`
  - `GET /api/v1/sessions/{sessionId}/recommendations/latest`
  - same `RecommendationRunResponse` shape from `API_CONTRACT.md`.
- Save recommendation runs with a workflow trace snapshot that excludes raw chain-of-thought:
  - graph version
  - profile summary
  - rule match results
  - retrieval queries
  - evidence chunk IDs/source IDs
  - evidence statuses
  - provider name/model
  - fallback reason when used.
- Validate every LLM-generated response with Pydantic before storing or returning.
- If validation fails, the provider errors, or evidence is insufficient, return deterministic template recommendations using the existing safe language and retrieved citations where available.
- Keep recommendation language safe:
  - use `likely_match`, `possible_match`, `more_info_needed`.
  - do not emit `not_matched` in visible cards.
  - never say “you qualify”, “approved”, or “guaranteed”.
  - never diagnose, recommend treatment, or recommend medication changes.
  - never create source IDs, URLs, page numbers, phone numbers, deadlines, or program rules not present in stored evidence/resource data.
- Keep frontend changes minimal:
  - continue rendering the existing recommendation/action-plan/source fields.
  - show backend fallback or evidence status if already present in the response.
  - no chatbot-first UI or new source viewer behavior in Phase 6.

Public interfaces / types:

- Reuse:
  - `GenerateRecommendationsRequest { includeRagEvidence: boolean, regenerate: boolean }`
  - `RecommendationRunResponse`
  - `SupportRecommendation`
  - `SourceCitation`
  - `QuestionGroups`
  - `ActionPlanItem`
- Add backend-internal schemas:
  - `RecommendationGraphState`
  - `ProfileSummary`
  - `RetrievalQuery`
  - `EvidenceBundle`
  - `EvidenceGrade`
  - `GeneratedRecommendationPayload`
  - `RecommendationWorkflowTrace`
- Add provider interfaces:
  - `RecommendationLlmProvider.generate(payload) -> GeneratedRecommendationPayload`
  - `FakeRecommendationLlmProvider`
  - optional real provider implementation behind settings.
- Do not change the stored `recommendation_runs.result_json` response shape; add trace/provider metadata only to `input_snapshot` or a backward-compatible metadata field if one already exists.

Suggested file plan:

- Modify `backend/requirements.txt` for LangGraph/LangChain dependencies if they are not already installed.
- Modify `backend/app/core/config.py` for LLM provider settings.
- Create `backend/app/ai/__init__.py`.
- Create `backend/app/ai/llm_provider.py` for provider interfaces, fake provider, provider builder, and timeout/error handling.
- Create `backend/app/schemas/recommendation_workflow.py` for internal graph state and generated payload schemas.
- Create `backend/app/services/rule_matching_service.py` if needed to extract deterministic matching out of `RecommendationService` without changing behavior.
- Create `backend/app/services/recommendation_graph.py` for LangGraph node definitions and graph compilation.
- Modify `backend/app/services/recommendation_service.py` to call the graph when generating recommendations and to store the trace snapshot.
- Modify `backend/app/api/v1/recommendations.py` to inject the LLM provider into the service.
- Add tests in `backend/tests/test_recommendation_graph.py`.
- Extend existing tests in `backend/tests/test_recommendations.py`.
- Extend frontend tests only if new response fields are displayed.

Implementation tasks:

1. Lock current deterministic behavior with tests.
   - Add or confirm tests that demo profile still returns rehab, transportation, and caregiver support recommendations.
   - Confirm no visible card uses final-certainty language.
   - Run: `rtk backend/.venv/bin/python -m pytest backend/tests/test_recommendations.py -q`.

2. Add provider settings and fake LLM provider.
   - Add config fields for provider/model/temperature/API key.
   - Implement `FakeRecommendationLlmProvider` that returns deterministic, contract-shaped JSON from profile/rule/evidence input.
   - Test provider output validates and contains no invented source IDs.

3. Extract deterministic rule matching into a reusable service.
   - Move matching logic without behavior changes.
   - Keep existing RecommendationService tests passing before adding LangGraph orchestration.

4. Add internal workflow schemas.
   - Model graph state, retrieval queries, evidence bundles, evidence grades, generated payload, and trace metadata.
   - Forbid unknown fields on LLM-facing generated payload schemas.

5. Build LangGraph nodes.
   - `build_profile_summary`: normalize profile and location display fields.
   - `run_rule_matching`: call deterministic rule matcher.
   - `generate_retrieval_queries`: build 1-2 query strings per visible match using resource category, matched factors, missing information, state, and county.
   - `retrieve_evidence`: call `RagSearchService` with category/resource/location filters.
   - `grade_evidence`: set `partial` when chunks exist and `insufficient` otherwise.
   - `generate_recommendations`: call the LLM provider with profile summary, rule matches, resource details, and evidence snippets.
   - `validate_output`: Pydantic-validate generated JSON and source citations against retrieved chunks.
   - `fallback_response`: use deterministic templates when provider output fails validation or provider call fails.
   - `generate_action_plan`: produce checklist and questions from validated recommendations.

6. Wire graph into recommendation generation.
   - `RecommendationService.generate()` should call the graph and save the final response exactly as `RecommendationRunResponse`.
   - Store trace metadata without raw prompts, raw chain-of-thought, or secrets.
   - Keep `get_latest()` compatible with previous runs.

7. Add backend tests.
   - Fake provider happy path returns validated recommendation JSON.
   - Graph calls rule matching before retrieval.
   - Graph uses Phase 5 source chunks as citations and preserves source IDs.
   - Evidence grading returns `partial` when chunks exist and `insufficient` when none match.
   - Provider validation rejects invented source IDs.
   - Provider validation rejects forbidden certainty phrases.
   - Provider failure falls back to deterministic recommendations and still stores a run.
   - Missing session returns standard `404`.
   - Existing resource, RAG, ingestion, session, health, and config tests still pass.

8. Add minimal frontend regression tests only if response rendering changes.
   - Existing Benefits and Plan pages should continue rendering the same response shape.
   - Responsible AI copy remains visible.
   - Forbidden certainty words do not render.

Verification commands:

- `rtk backend/.venv/bin/python -m pytest backend/tests -q`
- `rtk npm --prefix frontend test -- --run`
- `rtk npm --prefix frontend run build`
- Optional local integration:
  - `rtk docker compose up -d postgres`
  - run ingestion with fake embeddings
  - start backend
  - call `POST /api/v1/sessions/demo`
  - call `POST /api/v1/sessions/{sessionId}/recommendations` with `{ "includeRagEvidence": true, "regenerate": true }`
  - confirm stored run has source citations, evidence status, disclaimer, and trace metadata.

Assumptions:

- Phase 5 RAG search/source viewer is already implemented and working.
- Default local and CI behavior uses fake LLM and fake embeddings, so no external credential is required.
- Real provider integration is optional and must be disabled unless explicitly configured.
- The rule engine remains the authority for candidate support matches and match statuses.
- LLM output is treated as untrusted until validated.
- No raw chain-of-thought, secrets, invented citations, or final-certainty claims are stored or returned.
- Frontend should require little or no change because the public recommendation response shape remains stable.

### Phase 7 — Resource Detail and Action Plan Polish

Summary:

Build a polished resource-detail and action-plan experience on top of the existing Phase 5/6 recommendation flow. Add a normal frontend route at `/resources/:resourceId`, link recommendation cards into that page, enrich backend resource detail with stored source evidence when available, and make the Plan page feel like a practical caregiver checklist.

Keep Phase 7 scoped to resource detail and plan polish. Do not add new matching rules, auth, Rehab Snapshot logic, chatbot behavior, new LLM workflows, or new dependencies.

Key changes:

1. Backend resource detail:
   - Keep `GET /api/v1/resources/{resourceId}` as the public endpoint.
   - Extend `ResourceDetail.sources` from empty placeholders to citation-ready source entries derived from `document_chunks.resource_id`.
   - Include `sourceId`, `title`, `url`, `sourceType`, `page`, `authorityLevel`, and optional `excerpt` when a linked chunk exists.
   - Preserve standard `404` error wrapper and safe language.

2. Frontend resource detail:
   - Add `getResource(resourceId)` to the API client.
   - Add frontend `ResourceDetail` and `ResourceSourceCitation` types.
   - Add `/resources/:resourceId` route and `ResourceDetailPage`.
   - Render name, match status when opened from a recommendation, why this may fit, eligibility factors, missing information, documents, next steps, questions, sources, and responsible AI disclaimer.
   - Link recommendation cards to `/resources/{recommendation.id}` with `View details`.
   - Keep source links pointing to `/sources/:sourceId`.

3. Action plan polish:
   - Keep action plan data from the existing recommendation response.
   - Improve Plan page hierarchy into `Today`, `This Week`, and `At Next Appointment` lanes.
   - Add resource-detail links from action items when the action title matches a recommendation next step.
   - Keep checkbox UI local-only; do not persist completion state in Phase 7.
   - Keep stakeholder question groups visible and easier to scan.

4. UI and language rules:
   - Use the current healthcare visual direction and Lucide icons.
   - Avoid chatbot-first layout and marketing hero treatment.
   - Do not use forbidden certainty language: “you qualify”, “approved”, or “guaranteed”.
   - Keep Resource Detail secondary to Benefits and Plan, not a new dashboard.

Test plan:

- Backend resource detail includes eligibility factors, documents, steps, safe language, and source metadata/excerpt when chunks are linked by `resource_id`.
- Backend resource detail returns `sources: []` when no chunks are linked.
- Missing resources return the standard `404` wrapper.
- Frontend recommendation cards render `View details` links to resource detail pages.
- Frontend resource detail renders required sections, source excerpt, source viewer link, and error state.
- Plan page renders grouped action lanes, local checkboxes, resource-detail links, and stakeholder questions.
- Responsible AI copy remains visible and forbidden certainty words do not render.

Verification commands:

- `rtk backend/.venv/bin/python -m pytest backend/tests -q`
- `rtk npm --prefix frontend test -- --run`
- `rtk npm --prefix frontend run build`

### Phase 8 — Module 2 Integration

Summary:

Merge the friend’s `ai_hackathon-module2` Rehab Snapshot into the main CareBridge app as an integrated optional route, not a separate service. Module 2 becomes a supporting mobility-signal workflow inside Module 1: it can run the camera-based assessment, summarize observations, save a Rehab Snapshot to the existing FastAPI backend, and trigger a recommendation refresh that can prioritize rehab, home-health, and transportation support without making diagnosis or eligibility claims.

Keep the old `ai_hackathon-module2/` folder as reference during implementation; do not run it as a second app after integration.

Key changes:

1. Frontend integration:
   - Add route `/rehab-snapshot` and a secondary nav/action entry labeled `Rehab Snapshot`.
   - Port the Module 2 camera flow into TypeScript under the main frontend, preserving the three tasks: Sit-to-Stand, Arm Raise, and Standing Balance.
   - Replace Module 2 emoji/CSS-heavy UI with existing CareBridge Tailwind healthcare styling and Lucide icons.
   - Add a deterministic `Use demo mobility snapshot` path for tests, demos, camera-denied browsers, and offline MediaPipe failures.
   - After assessment completion, show `Optional Mobility Snapshot` with mobility concern, observations, and `Update Support Plan`.

2. Backend integration:
   - Add `rehab_snapshots` SQLAlchemy model/table through the existing create-all pattern.
   - Add router, service, repository, and schema layers for `POST /api/v1/sessions/{sessionId}/rehab-snapshot`.
   - Use the `API_CONTRACT.md` request shape: `mobilityConcern`, `observations`, `confidence`, and `capturedAt`.
   - Return the saved snapshot plus `suggestedRecompute: true`.
   - Do not store raw video, pose frames, or raw camera landmarks in Module 1.

3. Recommendation integration:
   - Recommendation generation loads the latest snapshot for the session and passes it into rule matching and the LangGraph trace as supporting context.
   - If `mobilityConcern` is `moderate` or `high`, add safe matched factors to rehab-related recommendations and move `rehab_services` earlier in the returned recommendation list.
   - If `mobilityConcern` is `high`, also prioritize `home_health_discussion` when present or create a safe `possible_match` discussion card if intake mobility was missing.
   - Keep statuses limited to existing safe values and never treat Rehab Snapshot as eligibility, diagnosis, or clinical severity.

4. Module 2 backend handling:
   - Do not merge the standalone Module 2 Groq backend or require `GROQ_API_KEY`.
   - Generate caregiver-facing summary copy deterministically in Module 1 from snapshot values, or reuse the existing Phase 6 LLM adapter only if already configured.
   - Frontend must not call any LLM API directly.

Public interfaces:

- Backend schemas:
  - `RehabMobilityConcern = "low" | "moderate" | "high" | "unable_to_assess"`
  - `RehabSnapshotRequest { mobilityConcern, observations, confidence?, capturedAt? }`
  - `RehabSnapshotResponse { sessionId, rehabSnapshot, suggestedRecompute }`
- Frontend types:
  - `RehabTaskMetrics` for local-only task results.
  - `RehabSnapshotRequest` matching the backend request.
  - `RehabSnapshot` for saved response state.
- Frontend API client:
  - `submitRehabSnapshot(sessionId, request)`.
  - CareBridge context stores the latest snapshot in local state/localStorage cache and clears stale recommendations after save.

Test plan:

- Backend saving a snapshot for an existing session returns the standard success wrapper and `suggestedRecompute: true`.
- Backend missing sessions return standard `404`, invalid mobility concern returns standard `422`, and persisted snapshots exclude raw video or landmark fields.
- Recommendation generation with `moderate` snapshot prioritizes rehab support and includes observed mobility factors.
- Recommendation generation with `high` snapshot prioritizes rehab and home-health discussion.
- Frontend `/rehab-snapshot` renders inside the CareBridge shell and empty session state routes users to intake or demo load.
- Demo mobility snapshot posts to `/sessions/{sessionId}/rehab-snapshot`, shows `Care Plan Updated with Rehab Data`, and triggers recommendation refresh.
- Camera-denied or MediaPipe-load failure shows a non-blocking fallback state.
- Benefits and Plan render the updated rehab priority after snapshot save.
- Responsible AI copy remains visible and forbidden certainty language does not render: `you qualify`, `approved`, `guaranteed`.

Verification commands:

- `rtk backend/.venv/bin/python -m pytest backend/tests -q`
- `rtk npm --prefix frontend test -- --run`
- `rtk npm --prefix frontend run build`

Assumptions:

- Phase 8 uses one integrated CareBridge frontend/backend; Module 2 is no longer a separately run app for the demo.
- MediaPipe remains browser/CDN-loaded for MVP, with a demo fallback to keep judging reliable.
- No new package dependencies are required.
- Rehab Snapshot is optional and supporting only; it never diagnoses, scores stroke severity, or determines final eligibility.
- Raw video and raw pose landmarks are not persisted.

### Phase 9 — Demo Polish

Summary:

Polish CareBridge for a reliable judge-facing demo after the Phase 8 Rehab Snapshot integration. Tighten the core flow so a judge can understand the product in seconds: demo persona, support matches, source evidence, action plan, resource detail, and optional Rehab Snapshot update.

Key changes:

1. Frontend demo path:
   - Improve visual hierarchy across Home, Benefits, Plan, Resource Detail, Source Viewer, and Rehab Snapshot.
   - Make the main demo path obvious from Home: load demo persona, review support matches with source evidence, open the action plan checklist, and optionally update with Rehab Snapshot.
   - Keep Rehab Snapshot secondary to Benefits and Plan.

2. Recovery states:
   - Add demo-focused empty, loading, and error states that always offer the next useful action.
   - Recovery actions should route to one of: load demo persona, start intake, generate recommendations, view benefits, view plan, or use demo mobility snapshot.
   - Keep backend/API failures visible without blocking the rest of the demo narrative.

3. Demo script:
   - Add `docs/demo-script.md` with a concise 3-5 minute walkthrough.
   - Include local setup commands, demo persona story, fallback path, and responsible AI talking points.
   - Use only safe language: possible match, may fit, worth discussing, more information needed.

4. Scope boundaries:
   - No new APIs.
   - No database schema changes.
   - No auth.
   - No new dependencies.
   - No new eligibility rules.
   - No new LLM workflow.
   - No chatbot-first UI.

Demo readiness checklist:

- Backend health endpoint responds.
- Session demo endpoint creates the John/Mother demo persona.
- Seed resources exist for rehab, home-health discussion, transportation, and caregiver support.
- RAG ingestion has run or demo source chunks are available.
- Recommendation generation returns support matches with safe match statuses.
- Benefits page shows evidence snippets and source detail links.
- Resource Detail and Source Viewer routes render successfully.
- Plan page shows grouped action lanes and stakeholder questions.
- Rehab Snapshot demo fallback can save a snapshot and refresh recommendations.
- Responsible AI boundary remains visible.

Test plan:

- Frontend verifies the Home page communicates the demo path.
- Frontend verifies empty and error states include recovery actions.
- Frontend verifies demo persona, recommendations with evidence, resource detail, source viewer, Plan, and Rehab Snapshot save/refresh continue to work.
- Responsible AI copy remains visible and forbidden language does not render: `you qualify`, `approved`, `guaranteed`, `diagnosed`, `treatment required`.

Verification commands:

- `rtk backend/.venv/bin/python -m pytest backend/tests -q`
- `rtk npm --prefix frontend test -- --run`
- `rtk npm --prefix frontend run build`

Assumptions:

- Phase 9 is the final polish phase for the hackathon MVP.
- Existing Phase 1-8 behavior is preserved and only refined for clarity, stability, and demo flow.
- Demo reliability is more important than adding new capability.
- `ai_hackathon-module2/` remains reference-only and is not run as a second app.
- CareBridge continues to avoid final eligibility, diagnosis, clinical severity, or medical-treatment claims.

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
