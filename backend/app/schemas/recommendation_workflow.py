from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.recommendation import ActionPlanItem, SupportRecommendation


class ProfileSummary(BaseModel):
    caregiverName: str | None = None
    careRecipient: str | None = None
    state: str | None = None
    county: str | None = None
    locationLabel: str | None = None
    dischargeTime: str | None = None
    mobility: str | None = None
    transportation: str | None = None
    insurance: str | None = None
    caregiverWorking: bool | None = None
    caregiverBurden: str | None = None
    biggestChallenge: str | None = None


class RetrievalQuery(BaseModel):
    resourceId: str
    category: str
    query: str
    filters: dict[str, str] = Field(default_factory=dict)


class EvidenceBundle(BaseModel):
    resourceId: str
    category: str
    chunks: list[dict[str, Any]] = Field(default_factory=list)


class EvidenceGrade(BaseModel):
    resourceId: str
    evidenceStatus: str
    chunkIds: list[str] = Field(default_factory=list)
    sourceIds: list[str] = Field(default_factory=list)


class GeneratedRecommendationPayload(BaseModel):
    summary: str
    recommendations: list[SupportRecommendation]
    actionPlan: list[ActionPlanItem]
    questionsToAsk: dict[str, list[str]]

    model_config = ConfigDict(extra="forbid")


class RecommendationWorkflowTrace(BaseModel):
    graphVersion: str
    provider: dict[str, str]
    profileSummary: dict
    rehabSnapshot: dict | None = None
    ruleMatches: list[dict]
    retrievalQueries: list[dict]
    evidence: list[dict]
    fallbackReason: str | None = None
