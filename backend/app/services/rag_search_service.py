from app.ai.embedding_provider import EmbeddingProvider
from app.db.models import DocumentChunk, SourceDocument
from app.db.repositories import SourceRepository
from app.rag.retrieval.scoring import cosine_similarity, keyword_overlap_score
from app.schemas.rag import RagSearchRequest, RagSearchResponse, RagSearchResult

AUTHORITY_BONUS = {
    "federal": 0.18,
    "state": 0.15,
    "county": 0.14,
    "healthcare": 0.11,
    "nonprofit": 0.08,
    "manual": 0.04,
}


class RagSearchService:
    """Hybrid RAG retriever with metadata filtering + vector/keyword scoring.

    For portability, this implementation scores in Python. With PostgreSQL + pgvector,
    the same service boundary can later be optimized with SQL vector operators.
    """

    def __init__(self, *, repository: SourceRepository, embedding_provider: EmbeddingProvider):
        self.repository = repository
        self.embedding_provider = embedding_provider

    def search(self, request: RagSearchRequest) -> RagSearchResponse:
        candidates = self.repository.list_chunks(
            resource_id=request.resourceId,
            category=request.category,
        )
        query_embedding = self.embedding_provider.embed(request.query)
        results: list[RagSearchResult] = []

        for chunk in candidates:
            source = self.repository.get_source(chunk.source_document_id)
            if source is None or not self._passes_location_filter(source, request.state, request.county):
                continue
            vector_score = cosine_similarity(query_embedding, chunk.embedding_json)
            keyword_score = keyword_overlap_score(request.query, chunk.chunk_text)
            metadata_score = self._metadata_score(source, chunk, request)
            final_score = round(0.55 * vector_score + 0.25 * keyword_score + 0.20 * metadata_score, 6)
            results.append(
                self._to_result(
                    chunk=chunk,
                    source=source,
                    score=final_score,
                    vector_score=round(vector_score, 6),
                    keyword_score=round(keyword_score, 6),
                    metadata_score=round(metadata_score, 6),
                )
            )

        results.sort(key=lambda result: result.score, reverse=True)
        return RagSearchResponse(
            query=request.query,
            filters={
                "resourceId": request.resourceId,
                "category": request.category,
                "state": request.state,
                "county": request.county,
                "topK": request.topK,
            },
            results=results[: request.topK],
        )

    @staticmethod
    def _passes_location_filter(source: SourceDocument, state: str | None, county: str | None) -> bool:
        # Federal/general sources with no state/county apply everywhere.
        if state and source.state and source.state != state:
            return False
        if county and source.county and source.county != county:
            return False
        return True

    @staticmethod
    def _metadata_score(source: SourceDocument, chunk: DocumentChunk, request: RagSearchRequest) -> float:
        score = 0.0
        if request.resourceId and chunk.resource_id == request.resourceId:
            score += 0.28
        if request.category and source.category == request.category:
            score += 0.18
        if request.state and source.state == request.state:
            score += 0.18
        elif source.state is None:
            score += 0.08
        if request.county and source.county == request.county:
            score += 0.18
        elif source.county is None:
            score += 0.06
        score += AUTHORITY_BONUS.get(source.authority_level, 0.03)
        return min(score, 1.0)

    @staticmethod
    def _to_result(
        *,
        chunk: DocumentChunk,
        source: SourceDocument,
        score: float,
        vector_score: float,
        keyword_score: float,
        metadata_score: float,
    ) -> RagSearchResult:
        return RagSearchResult(
            chunkId=chunk.id,
            sourceId=source.id,
            sourceTitle=source.title,
            publisher=source.publisher,
            url=source.source_url,
            authorityLevel=source.authority_level,
            resourceId=chunk.resource_id,
            category=source.category,
            state=source.state,
            county=source.county,
            sectionTitle=chunk.section_title,
            page=chunk.page_number,
            score=score,
            vectorScore=vector_score,
            keywordScore=keyword_score,
            metadataScore=metadata_score,
            text=chunk.chunk_text,
        )
