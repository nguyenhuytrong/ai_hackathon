from pydantic import BaseModel, Field


class GenerateRecommendationsRequest(BaseModel):
    includeRagEvidence: bool = False
    useLlmExplanation: bool = False
    regenerate: bool = True


class RuleMatchResult(BaseModel):
    resourceId: str
    matchStatus: str
    matchedFactors: list[str]
    missingInformation: list[str]
    reasonCodes: list[str] = Field(default_factory=list)


class SourceCitation(BaseModel):
    sourceId: str
    title: str
    sourceType: str
    url: str | None = None
    page: int | None = None
    excerpt: str | None = None


class SupportRecommendation(BaseModel):
    id: str
    title: str
    category: str
    matchStatus: str
    matchedFactors: list[str]
    missingInformation: list[str]
    whyThisMayFit: list[str]
    evidenceSummary: list[str] = Field(default_factory=list)
    documentsToPrepare: list[str]
    nextSteps: list[str]
    questionsToAsk: list[str] = Field(default_factory=list)
    sources: list[SourceCitation] = Field(default_factory=list)
    evidenceStatus: str = "insufficient"


class ActionPlanItem(BaseModel):
    priority: int
    title: str
    timeframe: str
    checklist: list[str]


class RecommendationRunResponse(BaseModel):
    runId: str
    summary: str
    recommendations: list[SupportRecommendation]
    actionPlan: list[ActionPlanItem]
    questionsToAsk: dict[str, list[str]]
    disclaimer: str
