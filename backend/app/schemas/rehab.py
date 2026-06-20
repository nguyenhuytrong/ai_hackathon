from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class RehabMobilityConcern(str, Enum):
    low = "low"
    moderate = "moderate"
    high = "high"
    unable_to_assess = "unable_to_assess"


class RehabSnapshotRequest(BaseModel):
    mobilityConcern: RehabMobilityConcern
    observations: list[str] = Field(default_factory=list)
    confidence: str | None = None
    capturedAt: datetime | None = None

    model_config = ConfigDict(extra="forbid")


class RehabSnapshot(BaseModel):
    mobilityConcern: RehabMobilityConcern
    observations: list[str]
    confidence: str | None = None
    capturedAt: datetime | None = None


class RehabSnapshotResponse(BaseModel):
    sessionId: str
    rehabSnapshot: RehabSnapshot
    suggestedRecompute: bool
