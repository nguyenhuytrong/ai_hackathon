import os, json
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Any, Dict
from groq import Groq

app = FastAPI(title="Rehab Snapshot API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.environ["GROQ_API_KEY"])


# ── Models ────────────────────────────────────────────────────────────────────

class CMSBreakdown(BaseModel):
    arm:     Optional[float] = None
    sit:     Optional[float] = None
    balance: Optional[float] = None

class CMSResult(BaseModel):
    CMS:       float
    severity:  str          # normal | mild impairment | moderate impairment | severe impairment
    breakdown: Optional[CMSBreakdown] = None

class SitRaw(BaseModel):
    reps:       Optional[int]   = None
    avgTimeSec: Optional[float] = None
    difficulty: Optional[str]   = None

class ArmRaw(BaseModel):
    peakLeft:     Optional[float] = None
    peakRight:    Optional[float] = None
    asymmetryDeg: Optional[float] = None
    weakSide:     Optional[str]   = None
    difficulty:   Optional[str]   = None

class BalanceRaw(BaseModel):
    swayMagnitude: Optional[float] = None
    durationSec:   Optional[float] = None
    difficulty:    Optional[str]   = None

class RawMetrics(BaseModel):
    sit:     Optional[SitRaw]     = None
    arm:     Optional[ArmRaw]     = None
    balance: Optional[BalanceRaw] = None

class AssessmentInput(BaseModel):
    cms: Optional[CMSResult]  = None
    raw: Optional[RawMetrics] = None


# ── Prompt builder ────────────────────────────────────────────────────────────

SEVERITY_DESC = {
    "normal":              "within normal functional range",
    "mild impairment":     "mildly impaired",
    "moderate impairment": "moderately impaired — rehabilitation support recommended",
    "severe impairment":   "severely impaired — urgent rehabilitation support needed",
}

def build_prompt(data: AssessmentInput) -> str:
    lines = ["Mobility assessment for a post-stroke patient:\n"]

    # CMS summary
    if data.cms:
        c = data.cms
        desc = SEVERITY_DESC.get(c.severity, c.severity)
        lines.append(f"Overall Clinical Movement Score (CMS): {c.CMS:.2f} — {desc}")
        if c.breakdown:
            b = c.breakdown
            if b.arm     is not None: lines.append(f"  · Arm asymmetry score:    {b.arm:.2f}")
            if b.sit     is not None: lines.append(f"  · Sit-to-Stand score:     {b.sit:.2f}s avg")
            if b.balance is not None: lines.append(f"  · Balance sway score:     {b.balance:.4f}")

    # Raw task details
    if data.raw:
        r = data.raw
        lines.append("")
        if r.sit and r.sit.reps is not None:
            lines.append(
                f"- Sit-to-Stand: {r.sit.reps}/3 reps"
                + (f", avg {r.sit.avgTimeSec}s" if r.sit.avgTimeSec else "")
                + (f" [{r.sit.difficulty} difficulty]" if r.sit.difficulty else "")
            )
        if r.arm and r.arm.peakLeft is not None:
            lines.append(
                f"- Arm Raise: L {r.arm.peakLeft}° / R {r.arm.peakRight}°"
                f", asymmetry Δ{r.arm.asymmetryDeg}° ({r.arm.weakSide} side weaker)"
                + (f" [{r.arm.difficulty} difficulty]" if r.arm.difficulty else "")
            )
        if r.balance and r.balance.swayMagnitude is not None:
            lines.append(
                f"- Standing Balance: sway {r.balance.swayMagnitude:.4f}"
                f", held {r.balance.durationSec}s"
                + (f" [{r.balance.difficulty} difficulty]" if r.balance.difficulty else "")
            )

    lines.append("""
Based on these results, respond with valid JSON only — no markdown, no preamble:
{
  "caregiver_summary": "2-3 sentences in plain, compassionate language for family/caregiver describing what was observed and what it means for daily care",
  "clinical_flags": ["concise flag for care team 1", "flag 2"],
  "next_steps": ["practical recommendation for family 1", "step 2", "step 3"]
}

Rules:
- No diagnosis, no official clinical scores in the output
- caregiver_summary must be plain language (no jargon)
- clinical_flags may use professional terminology
- next_steps must be actionable for a non-medical caregiver
""")
    return "\n".join(lines)


def clean_json(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return raw.strip()


# ── Routes ────────────────────────────────────────────────────────────────────

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