"""
llm_reasoner.py

CareBridge LLM Reasoner
Compatible with:
    google-genai==2.8.0
"""

from __future__ import annotations

import asyncio
import json
import os

from google import genai
from google.genai import types
from pydantic import ValidationError

from models import (
    AssessmentRequest,
    RiskScores,
    Priority,
)

# ==========================================================
# Gemini Client
# ==========================================================

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

MODEL = "gemini-2.5-flash"

SYSTEM_PROMPT = """
You are CareBridge.

You help prioritize post-discharge care.

Return ONLY a JSON array.

Each object MUST contain exactly:

[
  {
    "rank": 1,
    "action": "....",
    "rationale": "....",
    "suggested_resources": [
      "...",
      "..."
    ]
  }
]

Rules:

- Return between 2 and 4 actions.
- Rank starts at 1.
- Lower rank = higher priority.
- No markdown.
- No explanations.
- No code fences.
- Output ONLY JSON.
"""

# ==========================================================
# Prompt Builder
# ==========================================================


def _build_prompt(
    req: AssessmentRequest,
    risks: RiskScores,
) -> str:

    lines = [
        f"Patient ID: {req.patient_id}",
        f"Diagnosis: {req.diagnosis}",
        f"Days since discharge: {req.days_since_discharge}",
        f"Mobility level: {req.mobility_level.value}",
    ]

    if req.affected_side:
        lines.append(f"Affected side: {req.affected_side}")

    lines.extend([
        "",
        "Risk Assessment",
        f"Transportation barrier: {risks.transportation_barrier.value}",
        f"Rehab follow-up risk: {risks.rehab_followup_risk.value}",
        f"Medication adherence: {risks.medication_adherence.value}",
        f"Caregiver burden: {risks.caregiver_burden.value}",
        "",
        "Patient Context",
        f"Has caregiver: {req.has_caregiver}",
        f"Has transport: {req.has_transport}",
        f"Has insurance: {req.has_insurance}",
        f"Missing medications: {req.missing_medications}",
        f"PT scheduled: {req.pt_scheduled}",
    ])

    if req.caregiver_notes:
        lines.append(f"Caregiver notes: {req.caregiver_notes}")

    lines.extend([
        "",
        "Return ONLY valid JSON.",
    ])

    return "\n".join(lines)


# ==========================================================
# Gemini Call
# ==========================================================


async def _generate(prompt: str):

    last_error = None

    for attempt in range(5):

        try:

            response = await client.aio.models.generate_content(
                model=MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.3,
                    max_output_tokens=4096,
                    response_mime_type="application/json",
                ),
            )

            return response

        except Exception as e:

            last_error = e

            if "429" in str(e):
                wait = 5 * (attempt + 1)
                print(f"Quota exceeded. Retry in {wait}s...")
                await asyncio.sleep(wait)
                continue

            raise

    raise RuntimeError(last_error)


# ==========================================================
# Public API
# ==========================================================


async def generate_priorities(
    req: AssessmentRequest,
    risks: RiskScores,
) -> list[Priority]:

    prompt = _build_prompt(req, risks)

    response = await _generate(prompt)

    # ===== DEBUG =====
    print("\n================ RESPONSE ================")
    print(response)

    print("\n================ TEXT ====================")
    print(repr(response.text))

    print("\n============= CANDIDATES =================")
    try:
        print(response.candidates)
    except Exception:
        pass

    print("==========================================\n")
    # =================

    if response is None:
        raise RuntimeError("Gemini returned no response.")

    if not response.text:
        raise RuntimeError("Gemini returned an empty response.")

    try:
        raw = json.loads(response.text)
    except json.JSONDecodeError:
        print("\n========== INVALID JSON ==========")
        print(response.text)
        print("==================================")
        raise RuntimeError("Gemini did not return valid JSON.")

    priorities = [
        Priority.model_validate(item)
        for item in raw
    ]

    priorities.sort(key=lambda x: x.rank)

    return priorities