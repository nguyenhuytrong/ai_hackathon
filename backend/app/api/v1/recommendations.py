from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.ai.llm_provider import build_recommendation_llm_provider
from app.db.repositories import RecommendationRunRepository, ResourceRepository, SessionRepository, SourceRepository
from app.db.session import get_db
from app.rag.ingestion.embeddings import build_embedding_provider
from app.schemas.common import ApiSuccess
from app.schemas.recommendation import GenerateRecommendationsRequest, RecommendationRunResponse
from app.services.recommendation_service import RecommendationService

router = APIRouter()


def get_recommendation_service(db: Session = Depends(get_db)) -> RecommendationService:
    settings = get_settings()
    return RecommendationService(
        sessions=SessionRepository(db),
        resources=ResourceRepository(db),
        recommendation_runs=RecommendationRunRepository(db),
        sources=SourceRepository(db),
        embedding_provider=build_embedding_provider(
            provider=settings.embedding_provider,
            model=settings.embedding_model,
            dimensions=settings.embedding_dimensions,
            api_key=settings.embedding_api_key,
        ),
        llm_provider=build_recommendation_llm_provider(
            provider=settings.llm_provider,
            model=settings.llm_model,
            temperature=settings.llm_temperature,
            api_key=settings.llm_api_key,
        ),
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
