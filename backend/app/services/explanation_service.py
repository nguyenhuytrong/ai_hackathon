from app.rag.retrieval.context_builder import RagContextBuilder
from app.schemas.rag import RagSearchResult
from app.schemas.recommendation import SupportRecommendation

FORBIDDEN_PHRASES = ("you qualify", "guaranteed", "will cover", "approved", "eligible for sure")


class ExplanationService:
    """Creates safe explanations from rule matches + retrieved evidence.

    The MVP uses deterministic grounded summaries. A real LLM provider can be
    placed behind this class later without changing RecommendationService.
    """

    def __init__(self):
        self.context_builder = RagContextBuilder()

    def enrich(self, recommendation: SupportRecommendation, evidence: list[RagSearchResult]) -> SupportRecommendation:
        if not evidence:
            recommendation.evidenceStatus = "insufficient"
            recommendation.evidenceSummary = [
                "CareBridge did not find enough trusted source evidence for this support pathway yet."
            ]
            return recommendation

        recommendation.evidenceStatus = "grounded"
        recommendation.evidenceSummary = self._build_evidence_summary(evidence)
        recommendation.whyThisMayFit = self._safe_lines(
            [
                *recommendation.whyThisMayFit,
                "Trusted source information was found that appears related to this support pathway.",
            ]
        )
        recommendation.questionsToAsk = self._questions_for_category(recommendation.category)
        return recommendation

    def build_context(self, evidence: list[RagSearchResult]) -> str:
        return self.context_builder.build(evidence)

    @staticmethod
    def _build_evidence_summary(evidence: list[RagSearchResult]) -> list[str]:
        summaries: list[str] = []
        seen: set[str] = set()
        for item in evidence:
            if item.sourceId in seen:
                continue
            summaries.append(
                f"{item.publisher or item.sourceTitle} has information related to {item.category.replace('_', ' ')}."
            )
            seen.add(item.sourceId)
            if len(summaries) >= 3:
                break
        return summaries

    @staticmethod
    def _questions_for_category(category: str) -> list[str]:
        if category == "transportation":
            return [
                "Does this plan or program help with non-emergency rides to medical appointments?",
                "How far in advance should rides be scheduled?",
            ]
        if category == "home_health":
            return [
                "Would home-based support be appropriate to discuss for this situation?",
                "What documentation is needed before home health can be reviewed?",
            ]
        if category == "caregiver_support":
            return [
                "Are respite, caregiver training, or local nonprofit supports available?",
                "Who should the caregiver contact first this week?",
            ]
        return ["Which office or care team member should confirm next steps?"]

    @staticmethod
    def _safe_lines(lines: list[str]) -> list[str]:
        safe: list[str] = []
        for line in lines:
            lowered = line.lower()
            if any(phrase in lowered for phrase in FORBIDDEN_PHRASES):
                continue
            safe.append(line)
        return safe
