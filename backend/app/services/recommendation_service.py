from uuid import uuid4

from fastapi import HTTPException, status

from app.ai.llm_provider import FakeRecommendationLlmProvider, RecommendationLlmProvider
from app.db.repositories import RecommendationRunRepository, ResourceRepository, SessionRepository, SourceRepository
from app.rag.ingestion.embeddings import EmbeddingProvider
from app.schemas.recommendation import GenerateRecommendationsRequest, RecommendationRunResponse
from app.seed.resources import seed_resources
from app.services.recommendation_graph import RecommendationGraphRunner

DISCLAIMER = "CareBridge does not determine final eligibility, provide medical advice, or replace healthcare professionals."


class RecommendationService:
    def __init__(
        self,
        *,
        sessions: SessionRepository,
        resources: ResourceRepository,
        recommendation_runs: RecommendationRunRepository,
        sources: SourceRepository | None = None,
        embedding_provider: EmbeddingProvider | None = None,
        llm_provider: RecommendationLlmProvider | None = None,
    ):
        self.sessions = sessions
        self.resources = resources
        self.recommendation_runs = recommendation_runs
        self.sources = sources
        self.embedding_provider = embedding_provider
        self.llm_provider = llm_provider or FakeRecommendationLlmProvider()
        seed_resources(resources)

    def generate(self, session_id: str, request: GenerateRecommendationsRequest) -> RecommendationRunResponse:
        session = self.sessions.get(session_id)
        if session is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

        run_id = f"rec_{uuid4().hex[:12]}"
        graph_result = RecommendationGraphRunner(
            resources={resource.id: resource for resource in self.resources.list_resources()},
            sources=self.sources,
            embedding_provider=self.embedding_provider,
            llm_provider=self.llm_provider,
        ).run(
            profile=session.profile_json,
            run_id=run_id,
            include_rag_evidence=request.includeRagEvidence,
        )
        self.recommendation_runs.create(
            run_id=run_id,
            session_id=session_id,
            input_snapshot={
                "profile": session.profile_json,
                "includeRagEvidence": request.includeRagEvidence,
                "workflow": graph_result.trace.model_dump(mode="json"),
            },
            result_json=graph_result.response.model_dump(mode="json"),
        )
        return graph_result.response

    def get_latest(self, session_id: str) -> RecommendationRunResponse:
        if self.sessions.get(session_id) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        run = self.recommendation_runs.get_latest(session_id)
        if run is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation run not found")
        return RecommendationRunResponse.model_validate(run.result_json)
