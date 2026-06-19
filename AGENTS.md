# AGENTS.md

## Purpose

This file defines repository-level rules for AI coding agents working on **CareBridge Navigator**.

CareBridge is a hackathon project focused on helping caregivers after stroke discharge understand possible public, healthcare, and community support options, why those options may fit, what information is missing, and what next steps to take.

Use the most specific project document as the source of truth:

- Scope, roadmap, phases: `PROJECT_PLAN.md`
- Endpoint paths and request/response shapes: `API_CONTRACT.md`
- UI/UX direction: `DESIGN.md`
- Architecture and module boundaries: `docs/architecture.md`
- Database model and persistence rules: `docs/database-schema.md`

If documents conflict, stop and call out the conflict before coding.

---

## Stack

Frontend:

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

Backend:

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- PostgreSQL
- Alembic optional
- Uvicorn

AI / RAG:

- LangChain
- LangGraph
- LLM API provider
- Embedding API provider
- PostgreSQL + pgvector preferred for MVP
- Qdrant optional stretch goal
- PyMuPDF / PDF loader
- Web document loader
- Recursive text splitter

Tooling:

- Docker
- Docker Compose
- npm
- Python virtual environment
- GitHub

---

## AI Coding Behavior Rules

### Think Before Coding

- State assumptions explicitly when the request is ambiguous.
- Ask for clarification when a decision affects architecture, API shape, database schema, or user flow.
- Do not silently choose a new product behavior when tradeoffs exist.
- Prefer the project documents over generic framework patterns.

### Simplicity First

- Implement the minimum code that creates a strong hackathon-quality product.
- Do not add speculative production infrastructure.
- Avoid unnecessary abstractions, microservices, queues, caching layers, or complex DevOps.
- Prioritize a working, polished flow over an overbuilt system.

### Surgical Changes

- Touch only the files required for the task.
- Do not refactor unrelated code.
- Match the existing style and folder structure.
- If unrelated issues are found, mention them instead of changing them.

### Goal-Driven Execution

- Define success criteria before editing.
- Prefer small, verifiable steps.
- Use mock data only when explicitly acceptable for demo flow.
- Report what was verified and what was not.

---

## Agent Workflow

- Inspect relevant files before editing.
- Read the relevant documentation file before changing behavior.
- Make small, focused changes.
- Do not rewrite large parts of the project without permission.
- Do not change API contracts or database schema without calling it out first.
- Do not add dependencies unless necessary; explain why.
- For large tasks, provide a short plan before coding.
- After coding, summarize changes and provide commands to run the app.

---

## Core Product Rules

CareBridge Navigator must focus on:

- Guided caregiver intake.
- Possible support / benefit matching.
- Eligibility interpretation in plain language.
- Evidence-grounded recommendations.
- Missing information identification.
- Action plan generation.
- Questions to ask doctors, therapists, social workers, and insurance providers.
- Responsible AI disclaimers.

CareBridge must not become primarily:

- A stroke diagnosis tool.
- A medical treatment recommender.
- A generic chatbot.
- A plain resource directory.
- A medication dispenser app.
- A full hospital management system.

---

## Core Implementation Rules

### Backend

- Use `Router -> Service -> Repository/Database` separation.
- FastAPI routers handle HTTP only.
- Services contain application logic.
- Repositories handle database access.
- Pydantic schemas define request/response contracts.
- Do not place business logic directly in route handlers.
- Follow `API_CONTRACT.md` for endpoint paths and response shapes.
- Keep backend modular but not microservice-based.

### RAG

- RAG retrieves evidence; it does not decide final eligibility by itself.
- Structured rule matching decides potential matches from user profile fields.
- LLM explains, summarizes, rewrites, and generates action plans using retrieved evidence.
- Do not let the LLM invent programs, phone numbers, URLs, deadlines, or eligibility criteria.
- Every recommendation should include source evidence when available.
- If evidence is insufficient, say so clearly.
- Store useful metadata with every document chunk:
  - source title
  - source URL
  - page number if PDF
  - category
  - state/county when known
  - authority level
  - resource ID if linked
- Prefer PostgreSQL + pgvector for MVP unless the project explicitly switches to Qdrant.

### Rule Matching

- Use simple deterministic rules for the MVP.
- Match status values:
  - `likely_match`
  - `possible_match`
  - `more_info_needed`
  - `not_matched`
- Never return `eligible` as a final status.
- Use “may qualify”, “may benefit”, “possible match”, or “worth discussing”.
- Track:
  - matched factors
  - missing information
  - next steps
  - source evidence

### LLM / LangGraph

- LangGraph may orchestrate the recommendation workflow:
  1. Build profile summary.
  2. Run rule matching.
  3. Generate retrieval queries.
  4. Retrieve evidence.
  5. Check evidence sufficiency.
  6. Generate recommendation JSON.
  7. Generate action plan and questions.
- LLM output should be structured JSON when used by the frontend.
- Validate LLM output before returning it to the frontend.
- Use fallback deterministic templates when the LLM call fails.

### Frontend

- Use React + TypeScript + Vite.
- Use route-level pages for major screens.
- Use shadcn/ui and Tailwind CSS for polished UI quickly.
- Keep components focused on presentation and UI state.
- Use TanStack Query for server state.
- Use React Hook Form and Zod for intake forms.
- Show loading, error, empty, and success states.
- Follow `DESIGN.md` for visual direction.
- Keep the user flow clear enough for judges to understand in seconds.

### Responsible AI

- Always include a visible disclaimer:
  - CareBridge does not determine final eligibility.
  - CareBridge does not provide medical advice.
  - CareBridge does not replace healthcare professionals or program administrators.
- Never diagnose stroke severity.
- Never recommend changing medication.
- Never say the patient qualifies with certainty.
- Rehab Snapshot data is a supporting signal only.

---

## Hackathon Priorities

Prioritize:

1. Working guided intake.
2. Recommendation cards with match explanation.
3. RAG-grounded source evidence.
4. Resource detail page.
5. Action plan checklist.
6. Questions to ask.
7. Clean, polished UI.
8. Module 2 input integration.

Deprioritize:

- Authentication.
- Complex security.
- Microservices.
- Redis.
- Kafka.
- Kubernetes.
- Heavy testing.
- Full admin dashboard.
- Production observability.
- Complex DevOps.
- Advanced document upload workflows.

---

## Do Not

- Do not build a full-screen chatbot as the primary UI.
- Do not make Rehab Snapshot the center of Module 1.
- Do not call recommendations “diagnosis” or “treatment”.
- Do not say “you qualify”.
- Do not invent sources or eligibility rules.
- Do not expose raw LLM chain-of-thought.
- Do not hard-code secrets or API keys in frontend code.
- Do not add Redis, Kafka, microservices, or Kubernetes before the MVP is stable.
- Do not change API response shapes silently.
- Do not store real patient data for demo unless explicitly approved.
- Do not overbuild authentication unless the team decides it is required.

---

## Output Format After Coding

1. Summary
2. Modified Files
3. How to Run / Test
4. Risks / Notes
5. Learning Notes

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **ai_hackathon** (239 symbols, 234 relationships, 0 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/ai_hackathon/context` | Codebase overview, check index freshness |
| `gitnexus://repo/ai_hackathon/clusters` | All functional areas |
| `gitnexus://repo/ai_hackathon/processes` | All execution flows |
| `gitnexus://repo/ai_hackathon/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
