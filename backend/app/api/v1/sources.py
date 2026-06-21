from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.repositories import SourceRepository
from app.db.session import get_db
from app.schemas.common import ApiSuccess
from app.schemas.rag import SourceDocumentResponse
from app.services.source_service import SourceService

router = APIRouter()


def get_source_service(db: Session = Depends(get_db)) -> SourceService:
    return SourceService(SourceRepository(db))


@router.get("/{source_id}", response_model=ApiSuccess[SourceDocumentResponse])
def get_source(source_id: str, service: SourceService = Depends(get_source_service)):
    return ApiSuccess(
        message="Source loaded successfully",
        data=service.get_source(source_id),
    )
