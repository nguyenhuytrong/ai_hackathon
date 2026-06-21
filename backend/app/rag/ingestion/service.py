import hashlib
from datetime import datetime, timezone

from app.db.models import DocumentChunk, SourceDocument
from app.db.repositories import SourceRepository
from app.rag.ingestion.chunking import chunk_text, clean_text
from app.rag.ingestion.embeddings import EmbeddingProvider
from app.rag.ingestion.loaders import load_source_text
from app.schemas.rag import IngestionRunSummary, SourceManifestEntry


class IngestionService:
    def __init__(
        self,
        *,
        repository: SourceRepository,
        embedding_provider: EmbeddingProvider,
        chunk_size: int = 140,
        chunk_overlap: int = 20,
    ):
        self.repository = repository
        self.embedding_provider = embedding_provider
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def ingest_entries(
        self,
        entries: list[SourceManifestEntry],
        *,
        dry_run: bool = False,
    ) -> IngestionRunSummary:
        summary = IngestionRunSummary(dryRun=dry_run)

        prepared_entries = []

        for entry in entries:
            text = clean_text(
                load_source_text(
                    source_url=entry.sourceUrl,
                    source_type=entry.sourceType,
                    content=entry.content,
                )
            )
            content_hash = self._content_hash(text)
            chunks = self._build_chunks(entry=entry, text=text, content_hash=content_hash)
            existing = self.repository.get_source(entry.sourceId)

            summary.sourcesProcessed += 1
            summary.chunksCreated += len(chunks)
            summary.sourceIds.append(entry.sourceId)

            if existing is None or existing.content_hash != content_hash:
                summary.sourcesChanged += 1

            prepared_entries.append((entry, content_hash, chunks))

        if dry_run:
            return summary

        for entry, content_hash, _chunks in prepared_entries:
            source = SourceDocument(
                id=entry.sourceId,
                title=entry.title,
                source_url=entry.sourceUrl,
                source_type=entry.sourceType,
                publisher=entry.publisher,
                authority_level=entry.authorityLevel,
                state=entry.state,
                county=entry.county,
                category=entry.category,
                verified_at=datetime.now(timezone.utc),
                content_hash=content_hash,
            )
            self.repository.upsert_source(source)

        self.repository.commit()

        for entry, _content_hash, chunks in prepared_entries:
            self.repository.replace_chunks(entry.sourceId, chunks)

        self.repository.commit()

        return summary

    def _build_chunks(
        self,
        *,
        entry: SourceManifestEntry,
        text: str,
        content_hash: str,
    ) -> list[DocumentChunk]:
        chunks = chunk_text(text, chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap)
        metadata = {
            "authorityLevel": entry.authorityLevel,
            "category": entry.category,
            "county": entry.county,
            "publisher": entry.publisher,
            "sourceTitle": entry.title,
            "sourceType": entry.sourceType,
            "sourceUrl": entry.sourceUrl,
            "state": entry.state,
        }
        return [
            DocumentChunk(
                id=f"chunk_{entry.sourceId}_{content_hash[:12]}_{index}",
                source_document_id=entry.sourceId,
                resource_id=entry.resourceId,
                chunk_text=chunk,
                page_number=entry.page,
                section_title=entry.sectionTitle,
                metadata_json=metadata,
                embedding_json=self.embedding_provider.embed(chunk),
            )
            for index, chunk in enumerate(chunks, start=1)
        ]

    @staticmethod
    def _content_hash(text: str) -> str:
        return hashlib.sha256(text.encode("utf-8")).hexdigest()
