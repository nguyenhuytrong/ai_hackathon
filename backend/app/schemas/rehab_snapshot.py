from pydantic import BaseModel, ConfigDict, Field


class CMSBreakdown(BaseModel):
    arm: float | None = None
    sit: float | None = None
    balance: float | None = None

    model_config = ConfigDict(extra="forbid")


class CMSResult(BaseModel):
    CMS: float = Field(..., ge=0)
    severity: str
    breakdown: CMSBreakdown | None = None

    model_config = ConfigDict(extra="forbid")


class SitRaw(BaseModel):
    reps: int | None = Field(default=None, ge=0)
    avgTimeSec: float | None = Field(default=None, ge=0)
    difficulty: str | None = None

    model_config = ConfigDict(extra="forbid")


class ArmRaw(BaseModel):
    peakLeft: float | None = None
    peakRight: float | None = None
    asymmetryDeg: float | None = Field(default=None, ge=0)
    weakSide: str | None = None
    difficulty: str | None = None

    model_config = ConfigDict(extra="forbid")


class BalanceRaw(BaseModel):
    swayMagnitude: float | None = Field(default=None, ge=0)
    durationSec: float | None = Field(default=None, ge=0)
    difficulty: str | None = None

    model_config = ConfigDict(extra="forbid")


class RawMetrics(BaseModel):
    sit: SitRaw | None = None
    arm: ArmRaw | None = None
    balance: BalanceRaw | None = None

    model_config = ConfigDict(extra="forbid")


class RehabSnapshotReportRequest(BaseModel):
    cms: CMSResult | None = None
    raw: RawMetrics | None = None

    model_config = ConfigDict(extra="forbid")


class RehabSnapshotReport(BaseModel):
    caregiverSummary: str
    clinicalFlags: list[str]
    nextSteps: list[str]
