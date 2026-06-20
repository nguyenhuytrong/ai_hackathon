# CareBridge Demo Script

## Local Setup

```bash
rtk docker compose up -d postgres
rtk backend/.venv/bin/python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
rtk npm --prefix frontend run dev
```

Open the frontend at the Vite URL, usually `http://localhost:5173`.

## 3-5 Minute Walkthrough

1. Home: introduce CareBridge as a benefits and support navigator for caregivers after stroke discharge. Click `Load Demo Persona`.
2. Demo persona: explain John is caring for his mother after a recent discharge in Montgomery County, Ohio, with mobility, transportation, Medicaid, and caregiver-burden concerns.
3. Benefits: show possible support matches, missing information, documents to prepare, next steps, and source snippets. Open a recommendation detail page.
4. Resource Detail and Source Viewer: show why the resource may fit, what to confirm, and the stored source evidence. Return to Benefits.
5. Plan: open the action plan checklist and show `Today`, `This Week`, and `At Next Appointment` lanes plus stakeholder questions.
6. Rehab Snapshot: open `Rehab Snapshot`, use `Use demo mobility snapshot`, then `Update Support Plan`. Return to Benefits or Plan to show rehab support is prioritized.

## Fallback Path

- If camera access is denied or MediaPipe cannot load, use `Use demo mobility snapshot`.
- If source ingestion is unavailable, focus on the recommendation card structure and say source evidence is shown when ingested chunks are present.
- If recommendation generation fails locally, reload the demo persona and use the visible empty/error recovery actions to continue the walkthrough.

## Responsible AI Talking Points

- CareBridge shows possible matches and next steps; it does not determine final eligibility.
- CareBridge does not provide medical advice or replace healthcare professionals, program administrators, therapists, or social workers.
- Rehab Snapshot observations are supporting signals only, not a diagnosis or clinical severity score.
- The caregiver should confirm program details, documents, and service availability with the relevant provider or administrator.
