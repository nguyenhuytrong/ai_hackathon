"""
models.py — All Pydantic data shapes for CareBridge Navigator.

Flow:
    AssessmentRequest  →  rule_engine + llm_reasoner  →  AssessmentResponse
"""

from __future__ import annotations
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


# ── Enums ─────────────────────────────────────────────────────────────────────

class MobilityLevel(str, Enum):
    INDEPENDENT   = "independent"    # walks unaided
    ASSISTED      = "assisted"       # needs help / walker / cane
    WHEELCHAIR    = "wheelchair"
    BEDBOUND      = "bedbound"

class RiskLevel(str, Enum):
    LOW    = "LOW"
    MEDIUM = "MEDIUM"
    HIGH   = "HIGH"


# ── Input ─────────────────────────────────────────────────────────────────────

class AssessmentRequest(BaseModel):
    # Patient identity
    patient_id: str = Field(..., description="Unique patient identifier")
    diagnosis: str  = Field(..., description="Primary diagnosis, e.g. 'Ischemic stroke'")
    days_since_discharge: int = Field(..., ge=0, description="Days since leaving hospital")

    # Clinical
    mobility_level: MobilityLevel
    affected_side: Optional[str] = Field(None, description="e.g. 'left arm', 'right leg'")

    # Logistics
    has_caregiver: bool       = Field(..., description="Someone at home to help")
    has_transport: bool       = Field(..., description="Reliable ride to follow-up appointments")
    has_insurance: bool       = Field(..., description="Active health insurance coverage")

    # Adherence
    missing_medications: bool = Field(..., description="Caregiver reports missed doses")
    pt_scheduled: bool        = Field(..., description="Physical therapy appointment booked")

    # Optional free-text for LLM context
    caregiver_notes: Optional[str] = Field(None, max_length=500)

    model_config = {
        "json_schema_extra": {
            "example": {
                "patient_id": "PT-2024-001",
                "diagnosis": "Ischemic stroke",
                "days_since_discharge": 5,
                "mobility_level": "assisted",
                "affected_side": "left arm",
                "has_caregiver": True,
                "has_transport": False,
                "has_insurance": True,
                "missing_medications": False,
                "pt_scheduled": False,
                "caregiver_notes": "Patient tires quickly; worried about stairs."
            }
        }
    }


# ── Intermediate ───────────────────────────────────────────────────────────────

class RiskScores(BaseModel):
    transportation_barrier: RiskLevel
    rehab_followup_risk:    RiskLevel
    medication_adherence:   RiskLevel   # note: LOW is good here
    caregiver_burden:       RiskLevel


# ── Output ────────────────────────────────────────────────────────────────────

class Priority(BaseModel):
    rank:        int    = Field(..., description="1 = most urgent")
    action:      str    = Field(..., description="Short imperative, e.g. 'Schedule PT'")
    rationale:   str    = Field(..., description="Why this is urgent for this patient")
    suggested_resources: list[str] = Field(default_factory=list)

class AssessmentResponse(BaseModel):
    patient_id: str
    risks:      RiskScores
    priorities: list[Priority] = Field(..., description="Ordered action plan from LLM")
