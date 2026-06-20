from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


class DischargeTime(str, Enum):
    less_than_7_days = "less_than_7_days"
    one_to_four_weeks = "one_to_four_weeks"
    more_than_one_month = "more_than_one_month"
    not_sure = "not_sure"


class MobilityStatus(str, Enum):
    independent = "independent"
    needs_some_assistance = "needs_some_assistance"
    needs_substantial_assistance = "needs_substantial_assistance"
    not_sure = "not_sure"


class TransportationStatus(str, Enum):
    available = "available"
    no_vehicle = "no_vehicle"
    cannot_drive = "cannot_drive"
    need_support = "need_support"
    not_sure = "not_sure"


class InsuranceType(str, Enum):
    medicare = "medicare"
    medicaid = "medicaid"
    private = "private"
    uninsured = "uninsured"
    not_sure = "not_sure"


class CaregiverBurden(str, Enum):
    low = "low"
    moderate = "moderate"
    elevated = "elevated"
    high = "high"
    not_sure = "not_sure"


class CreateSessionRequest(BaseModel):
    demoMode: bool = False


class IntakeProfile(BaseModel):
    caregiverName: str | None = None
    careRecipient: str | None = None
    dischargeTime: DischargeTime | None = None
    mobility: MobilityStatus | None = None
    transportation: TransportationStatus | None = None
    insurance: InsuranceType | None = None
    caregiverWorking: bool | None = None
    caregiverBurden: CaregiverBurden | None = None
    state: str | None = None
    county: str | None = None
    biggestChallenge: str | None = None

    model_config = ConfigDict(extra="forbid")


class SessionResponse(BaseModel):
    sessionId: str
    profile: dict
    createdAt: datetime
    updatedAt: datetime | None = None
