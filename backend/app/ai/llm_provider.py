from typing import Protocol


class RecommendationLlmProvider(Protocol):
    name: str
    model: str

    def generate(self, payload: dict) -> dict:
        """Return recommendation JSON using only the supplied payload."""


class FakeRecommendationLlmProvider:
    name = "fake"

    def __init__(self, model: str = "fake-carebridge-recommendations-v1"):
        self.model = model

    def generate(self, payload: dict) -> dict:
        recommendations = []
        for recommendation in payload["fallbackRecommendations"]:
            rewritten = {
                **recommendation,
                "whyThisMayFit": recommendation["whyThisMayFit"]
                or ["This support pathway may be worth discussing based on the intake profile."],
            }
            recommendations.append(rewritten)

        return {
            "summary": (
                f"Based on your situation, CareBridge found {len(recommendations)} "
                "support areas worth exploring."
            ),
            "recommendations": recommendations,
            "actionPlan": payload["fallbackActionPlan"],
            "questionsToAsk": payload["fallbackQuestionsToAsk"],
        }


def build_recommendation_llm_provider(
    *,
    provider: str,
    model: str,
    api_key: str | None = None,
    temperature: float = 0,
) -> RecommendationLlmProvider:
    if provider == "fake":
        return FakeRecommendationLlmProvider(model=model)
    raise RuntimeError(
        f"LLM provider '{provider}' is not configured. Set LLM_PROVIDER=fake or add a provider adapter."
    )
