from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from models import AssessmentRequest, AssessmentResponse
from rule_engine import score_risks
from llm_reasoner import generate_priorities
from database import init_db, save_assessment, get_assessment

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="CareBridge Navigator API",
    description="Post-discharge care coordination for caregivers",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "carebridge-navigator"}


@app.post("/assess", response_model=AssessmentResponse)
async def assess(request: AssessmentRequest):
    """
    Main endpoint.
    1. Run deterministic rule engine → risk scores
    2. Pass scores + context to LLM → prioritised action plan
    3. Persist to SQLite
    4. Return combined response
    """
    # Step 1 — rule-based risk scoring (fast, no API call)
    risks = score_risks(request)

    # Step 2 — LLM reasoning for human-readable priorities
    try:
        priorities = await generate_priorities(request, risks)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM call failed: {e}")

    # Step 3 — persist
    response = AssessmentResponse(
        patient_id=request.patient_id,
        risks=risks,
        priorities=priorities,
    )
    save_assessment(response)

    return response


@app.get("/assess/{patient_id}", response_model=AssessmentResponse)
def get_patient_assessment(patient_id: str):
    record = get_assessment(patient_id)
    if not record:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return record