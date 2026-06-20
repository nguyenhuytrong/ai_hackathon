from uuid import uuid4

from fastapi import HTTPException, status

from app.db.models import Resource
from app.db.repositories import RecommendationRunRepository, ResourceRepository, SessionRepository
from app.schemas.recommendation import (
    ActionPlanItem,
    GenerateRecommendationsRequest,
    RecommendationRunResponse,
    RuleMatchResult,
    SupportRecommendation,
)
from app.seed.resources import seed_resources

DISCLAIMER = "CareBridge does not determine final eligibility, provide medical advice, or replace healthcare professionals."


class RecommendationService:
    def __init__(
        self,
        *,
        sessions: SessionRepository,
        resources: ResourceRepository,
        recommendation_runs: RecommendationRunRepository,
    ):
        self.sessions = sessions
        self.resources = resources
        self.recommendation_runs = recommendation_runs
        seed_resources(resources)

    def generate(self, session_id: str, request: GenerateRecommendationsRequest) -> RecommendationRunResponse:
        session = self.sessions.get(session_id)
        if session is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

        run_id = f"rec_{uuid4().hex[:12]}"
        result = self._build_result(session.profile_json, run_id)
        run = self.recommendation_runs.create(
            run_id=run_id,
            session_id=session_id,
            input_snapshot={"profile": session.profile_json, "includeRagEvidence": request.includeRagEvidence},
            result_json=result.model_dump(mode="json"),
        )
        return result

    def get_latest(self, session_id: str) -> RecommendationRunResponse:
        if self.sessions.get(session_id) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        run = self.recommendation_runs.get_latest(session_id)
        if run is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation run not found")
        return RecommendationRunResponse.model_validate(run.result_json)

    def _build_result(self, profile: dict, run_id: str) -> RecommendationRunResponse:
        resources = {resource.id: resource for resource in self.resources.list_resources()}
        matches = self._match_profile(profile)
        recommendations = [
            self._recommendation_from_match(resources[match.resourceId], match)
            for match in matches
            if match.matchStatus != "not_matched"
        ]
        return RecommendationRunResponse(
            runId=run_id,
            summary=f"Based on your situation, CareBridge found {len(recommendations)} support areas worth exploring.",
            recommendations=recommendations,
            actionPlan=self._build_action_plan(recommendations),
            questionsToAsk=self._build_questions(),
            disclaimer=DISCLAIMER,
        )

    def _match_profile(self, profile: dict) -> list[RuleMatchResult]:
        matches: list[RuleMatchResult] = []
        mobility = profile.get("mobility")
        transportation = profile.get("transportation")
        caregiver_burden = profile.get("caregiverBurden")
        caregiver_working = profile.get("caregiverWorking")
        discharge_time = profile.get("dischargeTime")

        if mobility in {"needs_some_assistance", "needs_substantial_assistance"}:
            factors = ["Mobility support was reported as a current need."]
            if discharge_time in {"less_than_7_days", "one_to_four_weeks"}:
                factors.append("Recent discharge can make rehabilitation follow-up time-sensitive.")
            matches.append(
                RuleMatchResult(
                    resourceId="rehab_services",
                    matchStatus="likely_match",
                    matchedFactors=factors,
                    missingInformation=["Confirm whether outpatient or home-based therapy has already been scheduled."],
                )
            )
        elif self._missing(mobility):
            matches.append(
                RuleMatchResult(
                    resourceId="rehab_services",
                    matchStatus="more_info_needed",
                    matchedFactors=[],
                    missingInformation=["Tell CareBridge how much mobility support is needed."],
                )
            )

        if mobility == "needs_substantial_assistance":
            matches.append(
                RuleMatchResult(
                    resourceId="home_health_discussion",
                    matchStatus="possible_match",
                    matchedFactors=["Substantial mobility assistance may make home-based support worth discussing."],
                    missingInformation=["Confirm whether the care team has discussed home-based services."],
                )
            )

        if transportation in {"no_vehicle", "cannot_drive", "need_support"}:
            matches.append(
                RuleMatchResult(
                    resourceId="transportation_assistance",
                    matchStatus="possible_match",
                    matchedFactors=["Transportation is a barrier to follow-up care."],
                    missingInformation=["Confirm whether the insurance plan covers non-emergency medical transportation."],
                )
            )
        elif self._missing(transportation):
            matches.append(
                RuleMatchResult(
                    resourceId="transportation_assistance",
                    matchStatus="more_info_needed",
                    matchedFactors=[],
                    missingInformation=["Tell CareBridge whether transportation is a barrier."],
                )
            )

        caregiver_factors = []
        if caregiver_burden in {"elevated", "high"}:
            caregiver_factors.append("Caregiver burden was marked as elevated or high.")
        if caregiver_working is True:
            caregiver_factors.append("The caregiver is balancing work responsibilities.")
        if caregiver_factors:
            matches.append(
                RuleMatchResult(
                    resourceId="caregiver_support_programs",
                    matchStatus="possible_match",
                    matchedFactors=caregiver_factors,
                    missingInformation=["Confirm available respite, local nonprofit, or county caregiver support options."],
                )
            )
        elif self._missing(caregiver_burden):
            matches.append(
                RuleMatchResult(
                    resourceId="caregiver_support_programs",
                    matchStatus="more_info_needed",
                    matchedFactors=[],
                    missingInformation=["Tell CareBridge how heavy the caregiving load feels this week."],
                )
            )

        return matches

    @staticmethod
    def _missing(value: object) -> bool:
        return value is None or value == "not_sure"

    @staticmethod
    def _recommendation_from_match(resource: Resource, match: RuleMatchResult) -> SupportRecommendation:
        details = resource.details_json
        return SupportRecommendation(
            id=resource.id,
            title=resource.name,
            category=resource.category,
            matchStatus=match.matchStatus,
            matchedFactors=match.matchedFactors,
            missingInformation=match.missingInformation,
            whyThisMayFit=match.matchedFactors or ["CareBridge needs more intake information before matching this support pathway."],
            documentsToPrepare=details.get("documentsToPrepare", []),
            nextSteps=details.get("steps", [])[:1],
            sources=[],
            evidenceStatus="insufficient",
        )

    @staticmethod
    def _build_action_plan(recommendations: list[SupportRecommendation]) -> list[ActionPlanItem]:
        items = []
        for index, recommendation in enumerate(recommendations, start=1):
            items.append(
                ActionPlanItem(
                    priority=index,
                    title=recommendation.nextSteps[0] if recommendation.nextSteps else f"Review {recommendation.title}",
                    timeframe="today" if index == 1 else "this_week",
                    checklist=[
                        *recommendation.documentsToPrepare[:2],
                        "Write down questions before calling.",
                    ],
                )
            )
        return items

    @staticmethod
    def _build_questions() -> dict[str, list[str]]:
        return {
            "doctor": ["What support should we prioritize after discharge?"],
            "therapist": ["Is home-based therapy worth discussing?"],
            "socialWorker": ["Are transportation or caregiver support programs available?"],
            "insuranceProvider": ["Does this plan cover transportation or home-based support discussions?"],
        }
