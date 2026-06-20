from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.repositories import SourceRepository
from app.db.session import get_db
from app.rag.ingestion.embeddings import build_embedding_provider
from app.schemas.common import ApiSuccess
from app.schemas.rag import RagSearchRequest, RagSearchResponse
from app.services.rag_search_service import RagSearchService

router = APIRouter()


def get_rag_search_service(db: Session = Depends(get_db)) -> RagSearchService:
    settings = get_settings()
    return RagSearchService(
        repository=SourceRepository(db),
        embedding_provider=build_embedding_provider(
            provider=settings.embedding_provider,
            model=settings.embedding_model,
            dimensions=settings.embedding_dimensions,
            api_key=settings.embedding_api_key,
        ),
    )


@router.post("/search", response_model=ApiSuccess[RagSearchResponse])
def search_evidence(
    request: RagSearchRequest,
    service: RagSearchService = Depends(get_rag_search_service),
):
    return ApiSuccess(
        message="Evidence retrieved successfully",
        data=service.search(request),
    )
