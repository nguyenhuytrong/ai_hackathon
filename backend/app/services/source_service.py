from fastapi import HTTPException, status

from app.db.models import DocumentChunk, SourceDocument
from app.db.repositories import SourceRepository
from app.schemas.rag import DocumentChunkResponse, SourceDocumentResponse


class SourceService:
    def __init__(self, repository: SourceRepository):
        self.repository = repository

    def get_source(self, source_id: str) -> SourceDocumentResponse:
        source = self.repository.get_source(source_id)
        if source is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
        chunks = self.repository.list_chunks(source_document_id=source_id)
        return self._to_response(source, chunks)

    @staticmethod
    def _to_response(source: SourceDocument, chunks: list[DocumentChunk]) -> SourceDocumentResponse:
        return SourceDocumentResponse(
            sourceId=source.id,
            title=source.title,
            url=source.source_url,
            sourceType=source.source_type,
            publisher=source.publisher,
            authorityLevel=source.authority_level,
            state=source.state,
            county=source.county,
            category=source.category,
            uploadedAt=source.uploaded_at,
            verifiedAt=source.verified_at,
            contentHash=source.content_hash,
            chunks=[
                DocumentChunkResponse(
                    chunkId=chunk.id,
                    sourceId=chunk.source_document_id,
                    resourceId=chunk.resource_id,
                    text=chunk.chunk_text,
                    page=chunk.page_number,
                    sectionTitle=chunk.section_title,
                    metadata=chunk.metadata_json,
                )
                for chunk in chunks
            ],
        )
