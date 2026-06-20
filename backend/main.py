import os, json
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from groq import Groq

app = FastAPI(title="Rehab Snapshot API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

client = Groq(api_key=os.environ["GROQ_API_KEY"])

class SitMetrics(BaseModel):
    reps: int
    avgTimeSec: Optional[float] = None
    difficulty: str

class ArmMetrics(BaseModel):
    peakLeft: Optional[float] = None
    peakRight: Optional[float] = None
    asymmetryDeg: float
    weakSide: str
    difficulty: str

class BalanceMetrics(BaseModel):
    swayMagnitude: float
    durationSec: float
    difficulty: str

class AssessmentInput(BaseModel):
    sit:     Optional[SitMetrics]     = None
    arm:     Optional[ArmMetrics]     = None
    balance: Optional[BalanceMetrics] = None

DIFFICULTY_LABEL = {
    "low": "within normal range",
    "moderate": "moderately limited",
    "high": "significantly limited",
}

def build_prompt(data: AssessmentInput) -> str:
    lines = ["Mobility assessment results for a stroke recovery patient:\n"]
    if data.sit:
        s = data.sit
        lines.append(
            f"- Sit-to-Stand: completed {s.reps}/3 reps"
            + (f", average {s.avgTimeSec}s per rep" if s.avgTimeSec else "")
            + f" → {DIFFICULTY_LABEL[s.difficulty]}"
        )
    if data.arm:
        a = data.arm
        lines.append(
            f"- Arm Raise: left shoulder {a.peakLeft}°, right {a.peakRight}°"
            f", asymmetry {a.asymmetryDeg}° ({a.weakSide} side weaker)"
            f" → {DIFFICULTY_LABEL[a.difficulty]}"
        )
    if data.balance:
        b = data.balance
        lines.append(
            f"- Standing Balance: held {b.durationSec}s, sway {b.swayMagnitude:.4f}"
            f" → {DIFFICULTY_LABEL[b.difficulty]}"
        )
    lines.append("""
Respond with valid JSON only, no markdown, no preamble:
{
  "caregiver_summary": "2-3 sentences in plain language for family/caregiver",
  "clinical_flags": ["flag 1", "flag 2"],
  "next_steps": ["step 1", "step 2", "step 3"]
}
Rules: no diagnosis, no official clinical scores, compassionate tone.""")
    return "\n".join(lines)

def clean_json(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return raw.strip()

@app.get("/health")
def health():
    return {"status": "ok", "model": "llama-3.3-70b-versatile"}

@app.post("/generate-report")
async def generate_report(data: AssessmentInput):
    prompt = build_prompt(data)
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=700,
            temperature=0.3,
        )
        raw = clean_json(response.choices[0].message.content)
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
