from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.ai.embedding_provider import build_embedding_provider
from app.core.config import get_settings
from app.db.repositories import RecommendationRunRepository, ResourceRepository, SessionRepository, SourceRepository
from app.db.session import get_db
from app.rag.ingestion.service import IngestionService
from app.schemas.common import ApiSuccess
from app.schemas.recommendation import GenerateRecommendationsRequest, RecommendationRunResponse
from app.services.rag_search_service import RagSearchService
from app.services.recommendation_service import RecommendationService

router = APIRouter()


def _build_provider():
    settings = get_settings()
    return build_embedding_provider(
        provider=settings.embedding_provider,
        model=settings.embedding_model,
        dimensions=settings.embedding_dimensions,
        api_key=settings.embedding_api_key,
    )


def get_recommendation_service(db: Session = Depends(get_db)) -> RecommendationService:
    source_repository = SourceRepository(db)
    embedding_provider = _build_provider()
    return RecommendationService(
        sessions=SessionRepository(db),
        resources=ResourceRepository(db),
        recommendation_runs=RecommendationRunRepository(db),
        sources=source_repository,
        rag_search=RagSearchService(repository=source_repository, embedding_provider=embedding_provider),
        ingestion=IngestionService(repository=source_repository, embedding_provider=embedding_provider),
    )


@router.post("/{session_id}/recommendations", response_model=ApiSuccess[RecommendationRunResponse])
def generate_recommendations(
    session_id: str,
    request: GenerateRecommendationsRequest | None = None,
    service: RecommendationService = Depends(get_recommendation_service),
):
    return ApiSuccess(
        message="Recommendations generated successfully",
        data=service.generate(session_id, request or GenerateRecommendationsRequest()),
    )


@router.get("/{session_id}/recommendations/latest", response_model=ApiSuccess[RecommendationRunResponse])
def get_latest_recommendations(
    session_id: str,
    service: RecommendationService = Depends(get_recommendation_service),
):
    return ApiSuccess(
        message="Latest recommendations loaded successfully",
        data=service.get_latest(session_id),
    )
