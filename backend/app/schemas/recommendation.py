from pydantic import BaseModel


class GenerateRecommendationsRequest(BaseModel):
    includeRagEvidence: bool = False
    regenerate: bool = True


class RuleMatchResult(BaseModel):
    resourceId: str
    matchStatus: str
    matchedFactors: list[str]
    missingInformation: list[str]


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
    documentsToPrepare: list[str]
    nextSteps: list[str]
    sources: list[SourceCitation] = []
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
