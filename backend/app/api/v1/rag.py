from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.repositories import SourceRepository
from app.db.session import get_db
from app.rag.ingestion.manifest import load_manifest
from app.rag.ingestion.service import IngestionService
from app.schemas.common import ApiSuccess
from app.schemas.rag import IngestionRunSummary, RagSearchRequest, RagSearchResponse
from app.ai.embedding_provider import build_embedding_provider
from app.services.rag_search_service import RagSearchService

router = APIRouter()


def build_provider():
    settings = get_settings()
    return build_embedding_provider(
        provider=settings.embedding_provider,
        model=settings.embedding_model,
        dimensions=settings.embedding_dimensions,
        api_key=settings.embedding_api_key,
    )


def get_rag_search_service(db: Session = Depends(get_db)) -> RagSearchService:
    return RagSearchService(repository=SourceRepository(db), embedding_provider=build_provider())


@router.post("/search", response_model=ApiSuccess[RagSearchResponse])
def search_rag(request: RagSearchRequest, service: RagSearchService = Depends(get_rag_search_service)):
    return ApiSuccess(message="RAG search completed successfully", data=service.search(request))


@router.post("/ingest", response_model=ApiSuccess[IngestionRunSummary])
def ingest_sources(dryRun: bool = False, db: Session = Depends(get_db)):
    service = IngestionService(repository=SourceRepository(db), embedding_provider=build_provider())
    return ApiSuccess(
        message="Sources ingested successfully" if not dryRun else "Dry-run ingestion completed successfully",
        data=service.ingest_entries(load_manifest(), dry_run=dryRun),
    )
