from collections.abc import Iterator

import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.models import Base
from app.db.repositories import SourceRepository
from app.rag.ingestion.embeddings import FakeEmbeddingProvider
from app.rag.ingestion.service import IngestionService
from app.schemas.rag import SourceManifestEntry
from app.services.source_service import SourceService


@pytest.fixture()
def db_session() -> Iterator[Session]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def source_entry(**overrides: object) -> SourceManifestEntry:
    data = {
        "sourceId": "src_transport_guide",
        "title": "Transportation Assistance Guide",
        "sourceUrl": "https://www.medicaid.gov/medicaid/benefits/non-emergency-medical-transportation/index.html",
        "sourceType": "webpage",
        "publisher": "Medicaid.gov",
        "authorityLevel": "official_government",
        "state": "OH",
        "county": "Montgomery",
        "category": "transportation",
        "resourceId": "transportation_assistance",
        "content": "Transportation support may be available for covered medical appointments. "
        "Families should ask how far in advance rides must be scheduled.",
    }
    data.update(overrides)
    return SourceManifestEntry.model_validate(data)


def test_manifest_validation_rejects_missing_required_metadata() -> None:
    invalid = source_entry().model_dump(by_alias=True)
    invalid.pop("authorityLevel")

    with pytest.raises(ValidationError):
        SourceManifestEntry.model_validate(invalid)


def test_fake_embeddings_are_deterministic_with_configured_dimension() -> None:
    provider = FakeEmbeddingProvider(dimensions=12)

    first = provider.embed("transportation help after discharge")
    second = provider.embed("transportation help after discharge")
    other = provider.embed("caregiver support")

    assert first == second
    assert first != other
    assert len(first) == 12


def test_ingestion_creates_sources_and_chunks_idempotently(db_session: Session) -> None:
    repository = SourceRepository(db_session)
    service = IngestionService(
        repository=repository,
        embedding_provider=FakeEmbeddingProvider(dimensions=8),
        chunk_size=8,
        chunk_overlap=2,
    )

    first = service.ingest_entries([source_entry()])
    second = service.ingest_entries([source_entry()])

    sources = repository.list_sources()
    chunks = repository.list_chunks(source_document_id="src_transport_guide")

    assert first.sourcesProcessed == 1
    assert first.chunksCreated == len(chunks)
    assert second.sourcesProcessed == 1
    assert second.chunksCreated == len(chunks)
    assert len(sources) == 1
    assert all(chunk.source_document_id == "src_transport_guide" for chunk in chunks)


def test_changed_source_content_replaces_old_chunks(db_session: Session) -> None:
    repository = SourceRepository(db_session)
    service = IngestionService(
        repository=repository,
        embedding_provider=FakeEmbeddingProvider(dimensions=8),
        chunk_size=5,
        chunk_overlap=0,
    )

    service.ingest_entries([source_entry(content="First version has old appointment ride instructions.")])
    old_chunks = repository.list_chunks(source_document_id="src_transport_guide")
    service.ingest_entries([source_entry(content="Updated version has new ride scheduling instructions.")])
    new_chunks = repository.list_chunks(source_document_id="src_transport_guide")

    assert old_chunks
    assert new_chunks
    assert {chunk.id for chunk in old_chunks}.isdisjoint({chunk.id for chunk in new_chunks})
    assert all("First version" not in chunk.chunk_text for chunk in new_chunks)


def test_chunks_preserve_citation_ready_metadata(db_session: Session) -> None:
    repository = SourceRepository(db_session)
    service = IngestionService(
        repository=repository,
        embedding_provider=FakeEmbeddingProvider(dimensions=8),
        chunk_size=7,
        chunk_overlap=0,
    )

    service.ingest_entries([source_entry()])

    chunks = repository.list_chunks(resource_id="transportation_assistance", category="transportation")

    assert chunks
    chunk = chunks[0]
    assert chunk.resource_id == "transportation_assistance"
    assert chunk.embedding_json
    assert chunk.metadata_json == {
        "authorityLevel": "official_government",
        "category": "transportation",
        "county": "Montgomery",
        "publisher": "Medicaid.gov",
        "sourceTitle": "Transportation Assistance Guide",
        "sourceType": "webpage",
        "sourceUrl": "https://www.medicaid.gov/medicaid/benefits/non-emergency-medical-transportation/index.html",
        "state": "OH",
    }


def test_source_service_returns_source_detail_with_chunks(db_session: Session) -> None:
    repository = SourceRepository(db_session)
    ingestion = IngestionService(
        repository=repository,
        embedding_provider=FakeEmbeddingProvider(dimensions=8),
        chunk_size=7,
        chunk_overlap=0,
    )
    ingestion.ingest_entries([source_entry()])

    detail = SourceService(repository).get_source("src_transport_guide")

    assert detail.sourceId == "src_transport_guide"
    assert detail.title == "Transportation Assistance Guide"
    assert detail.authorityLevel == "official_government"
    assert detail.chunks
    assert detail.chunks[0].metadata["category"] == "transportation"
