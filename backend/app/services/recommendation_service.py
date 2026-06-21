from uuid import uuid4

from fastapi import HTTPException, status

from app.db.models import Resource
from app.db.repositories import RecommendationRunRepository, ResourceRepository, SessionRepository, SourceRepository
from app.rag.ingestion.manifest import load_manifest
from app.rag.ingestion.service import IngestionService
from app.rag.retrieval.citation_builder import CitationBuilder
from app.rag.retrieval.query_builder import RagQueryBuilder
from app.schemas.rag import RagSearchRequest
from app.schemas.recommendation import (
    ActionPlanItem,
    GenerateRecommendationsRequest,
    RecommendationRunResponse,
    RuleMatchResult,
    SupportRecommendation,
)
from app.seed.resources import seed_resources
from app.services.explanation_service import ExplanationService
from app.services.rag_search_service import RagSearchService
from app.services.rule_matching_service import RuleMatchingService

DISCLAIMER = "CareBridge does not determine final eligibility, provide medical advice, or replace healthcare professionals."


class RecommendationService:
    def __init__(
        self,
        *,
        sessions: SessionRepository,
        resources: ResourceRepository,
        recommendation_runs: RecommendationRunRepository,
        sources: SourceRepository | None = None,
        rag_search: RagSearchService | None = None,
        ingestion: IngestionService | None = None,
    ):
        self.sessions = sessions
        self.resources = resources
        self.recommendation_runs = recommendation_runs
        self.sources = sources
        self.rag_search = rag_search
        self.ingestion = ingestion
        self.rule_matching = RuleMatchingService()
        self.query_builder = RagQueryBuilder()
        self.citation_builder = CitationBuilder()
        self.explanation = ExplanationService()
        seed_resources(resources)

    def generate(self, session_id: str, request: GenerateRecommendationsRequest) -> RecommendationRunResponse:
        session = self.sessions.get(session_id)
        if session is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

        run_id = f"rec_{uuid4().hex[:12]}"
        result = self._build_result(session.profile_json, run_id, request)
        self.recommendation_runs.create(
            run_id=run_id,
            session_id=session_id,
            input_snapshot={
                "profile": session.profile_json,
                "includeRagEvidence": request.includeRagEvidence,
                "useLlmExplanation": request.useLlmExplanation,
            },
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

    def _build_result(
        self,
        profile: dict,
        run_id: str,
        request: GenerateRecommendationsRequest,
    ) -> RecommendationRunResponse:
        resource_list = self.resources.list_resources()
        resource_map = {resource.id: resource for resource in resource_list}
        matches = self.rule_matching.match(
            profile=profile,
            resources=resource_list,
            rules=self.resources.list_rules(),
        )
        recommendations = []
        for match in matches:
            if match.matchStatus == "not_matched" or match.resourceId not in resource_map:
                continue
            recommendation = self._recommendation_from_match(resource_map[match.resourceId], match)
            if request.includeRagEvidence:
                recommendation = self._attach_rag_evidence(
                    profile=profile,
                    resource=resource_map[match.resourceId],
                    match=match,
                    recommendation=recommendation,
                )
            recommendations.append(recommendation)

        return RecommendationRunResponse(
            runId=run_id,
            summary=f"Based on your situation, CareBridge found {len(recommendations)} support areas worth exploring.",
            recommendations=recommendations,
            actionPlan=self._build_action_plan(recommendations),
            questionsToAsk=self._build_questions(),
            disclaimer=DISCLAIMER,
        )

    def _attach_rag_evidence(
        self,
        *,
        profile: dict,
        resource: Resource,
        match: RuleMatchResult,
        recommendation: SupportRecommendation,
    ) -> SupportRecommendation:
        if self.rag_search is None:
            return recommendation
        self._ensure_sources_available()
        query = self.query_builder.build_for_resource(
            profile=profile,
            resource=resource,
            matched_factors=match.matchedFactors,
        )
        response = self.rag_search.search(
            RagSearchRequest(
                query=query,
                resourceId=resource.id,
                category=resource.category,
                state=profile.get("state"),
                county=profile.get("county"),
                topK=5,
            )
        )
        recommendation.sources = self.citation_builder.build(response.results, max_sources=3)
        return self.explanation.enrich(recommendation, response.results)

    def _ensure_sources_available(self) -> None:
        if self.sources is None or self.ingestion is None:
            return
        if self.sources.list_chunks():
            return
        # The bundled manifest contains small trusted excerpts, so this is safe for local demos.
        self.ingestion.ingest_entries(load_manifest(), dry_run=False)

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
            whyThisMayFit=match.matchedFactors
            or ["CareBridge needs more intake information before matching this support pathway."],
            documentsToPrepare=details.get("documentsToPrepare", []),
            nextSteps=details.get("steps", [])[:1],
            sources=[],
            evidenceStatus="insufficient",
        )

    @staticmethod
    def _build_action_plan(recommendations: list[SupportRecommendation]) -> list[ActionPlanItem]:
        items = []
        for index, recommendation in enumerate(recommendations, start=1):
            checklist = [
                *recommendation.documentsToPrepare[:2],
                "Write down questions before calling.",
            ]
            if recommendation.sources:
                checklist.append("Review the source links before making calls.")
            items.append(
                ActionPlanItem(
                    priority=index,
                    title=recommendation.nextSteps[0] if recommendation.nextSteps else f"Review {recommendation.title}",
                    timeframe="today" if index == 1 else "this_week",
                    checklist=checklist,
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
