import math
import re

from fastapi import HTTPException, status

from app.db.models import DocumentChunk
from app.db.repositories import SourceRepository
from app.rag.ingestion.embeddings import EmbeddingProvider
from app.schemas.rag import RagSearchRequest, RagSearchResponse, RagSearchResult, RagSearchSource


class RagSearchService:
    def __init__(self, repository: SourceRepository, embedding_provider: EmbeddingProvider):
        self.repository = repository
        self.embedding_provider = embedding_provider

    def search(self, request: RagSearchRequest) -> RagSearchResponse:
        try:
            query_embedding = self.embedding_provider.embed(request.query)
        except RuntimeError as error:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error

        chunks = [
            chunk
            for chunk in self.repository.list_chunks()
            if self._matches_filters(chunk, request)
        ]
        ranked = sorted(
            (
                (self._score(request.query, query_embedding, chunk), chunk)
                for chunk in chunks
            ),
            key=lambda item: item[0],
            reverse=True,
        )[: request.topK]
        return RagSearchResponse(
            query=request.query,
            results=[
                self._to_result(score=score, chunk=chunk)
                for score, chunk in ranked
            ],
        )

    @staticmethod
    def _matches_filters(chunk: DocumentChunk, request: RagSearchRequest) -> bool:
        filters = request.filters
        if filters is None:
            return True
        metadata = chunk.metadata_json
        if filters.category and metadata.get("category") != filters.category:
            return False
        if filters.state and metadata.get("state") != filters.state:
            return False
        if filters.county and metadata.get("county") != filters.county:
            return False
        if filters.resourceId and chunk.resource_id != filters.resourceId:
            return False
        if filters.sourceId and chunk.source_document_id != filters.sourceId:
            return False
        return True

    def _to_result(self, *, score: float, chunk: DocumentChunk) -> RagSearchResult:
        source = self.repository.get_source(chunk.source_document_id)
        metadata = chunk.metadata_json
        return RagSearchResult(
            chunkId=chunk.id,
            score=round(score, 4),
            text=chunk.chunk_text,
            source=RagSearchSource(
                sourceId=chunk.source_document_id,
                title=source.title if source else metadata.get("sourceTitle", "Unknown Source"),
                url=source.source_url if source else metadata.get("sourceUrl"),
                page=chunk.page_number,
                authorityLevel=source.authority_level if source else metadata.get("authorityLevel", "unknown"),
            ),
            metadata=metadata,
        )

    @staticmethod
    def _score(query: str, query_embedding: list[float], chunk: DocumentChunk) -> float:
        cosine = RagSearchService._cosine_score(query_embedding, chunk.embedding_json)
        lexical = RagSearchService._lexical_score(query, chunk.chunk_text)
        return (lexical * 0.7) + (cosine * 0.3)

    @staticmethod
    def _cosine_score(query_embedding: list[float], chunk_embedding: list[float]) -> float:
        paired = list(zip(query_embedding, chunk_embedding))
        if not paired:
            return 0.0
        dot = sum(left * right for left, right in paired)
        query_norm = math.sqrt(sum(left * left for left, _right in paired))
        chunk_norm = math.sqrt(sum(right * right for _left, right in paired))
        if not query_norm or not chunk_norm:
            return 0.0
        cosine = dot / (query_norm * chunk_norm)
        return max(0.0, (cosine + 1.0) / 2.0)

    @staticmethod
    def _lexical_score(query: str, text: str) -> float:
        query_terms = set(re.findall(r"[a-z0-9]+", query.lower()))
        text_terms = set(re.findall(r"[a-z0-9]+", text.lower()))
        if not query_terms:
            return 0.0
        return len(query_terms & text_terms) / len(query_terms)
