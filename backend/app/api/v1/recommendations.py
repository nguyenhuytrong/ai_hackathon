from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.repositories import RecommendationRunRepository, ResourceRepository, SessionRepository
from app.db.session import get_db
from app.schemas.common import ApiSuccess
from app.schemas.recommendation import GenerateRecommendationsRequest, RecommendationRunResponse
from app.services.recommendation_service import RecommendationService

router = APIRouter()


def get_recommendation_service(db: Session = Depends(get_db)) -> RecommendationService:
    return RecommendationService(
        sessions=SessionRepository(db),
        resources=ResourceRepository(db),
        recommendation_runs=RecommendationRunRepository(db),
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
