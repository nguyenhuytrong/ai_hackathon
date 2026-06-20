from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.models import Base
from app.db.repositories import SourceRepository
from app.db.session import get_db
from app.main import app
from app.rag.ingestion.embeddings import FakeEmbeddingProvider
from app.rag.ingestion.service import IngestionService
from app.schemas.rag import SourceManifestEntry


@pytest.fixture()
def seeded_client() -> Iterator[TestClient]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    seed_db = TestingSessionLocal()
    IngestionService(
        repository=SourceRepository(seed_db),
        embedding_provider=FakeEmbeddingProvider(dimensions=16),
        chunk_size=10,
        chunk_overlap=0,
    ).ingest_entries(
        [
            source_entry(),
            source_entry(
                sourceId="src_rehab_guide",
                title="Stroke Rehabilitation Guide",
                category="rehab",
                resourceId="rehab_services",
                sourceUrl="https://medlineplus.gov/strokerehabilitation.html",
                publisher="MedlinePlus",
                content="Rehabilitation after stroke can include physical therapy and occupational therapy.",
            ),
        ]
    )
    seed_db.close()

    def override_get_db() -> Iterator[Session]:
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
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


def test_rag_search_returns_matching_chunks_with_citation_metadata(seeded_client: TestClient) -> None:
    response = seeded_client.post(
        "/api/v1/rag/search",
        json={
            "query": "transportation help for medical appointments",
            "filters": {"category": "transportation"},
            "topK": 1,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    results = payload["data"]["results"]
    assert payload["message"] == "Evidence retrieved successfully"
    assert payload["data"]["query"] == "transportation help for medical appointments"
    assert len(results) == 1
    assert results[0]["chunkId"].startswith("chunk_src_transport_guide")
    assert results[0]["score"] >= 0
    assert "Transportation support may be available" in results[0]["text"]
    assert results[0]["source"] == {
        "sourceId": "src_transport_guide",
        "title": "Transportation Assistance Guide",
        "url": "https://www.medicaid.gov/medicaid/benefits/non-emergency-medical-transportation/index.html",
        "page": None,
        "authorityLevel": "official_government",
    }
    assert results[0]["metadata"]["category"] == "transportation"


def test_rag_search_filters_by_location_resource_and_source(seeded_client: TestClient) -> None:
    response = seeded_client.post(
        "/api/v1/rag/search",
        json={
            "query": "ride scheduling",
            "filters": {
                "category": "transportation",
                "state": "OH",
                "county": "Montgomery",
                "resourceId": "transportation_assistance",
                "sourceId": "src_transport_guide",
            },
            "topK": 1,
        },
    )

    assert response.status_code == 200
    results = response.json()["data"]["results"]
    assert len(results) == 1
    assert results[0]["source"]["sourceId"] == "src_transport_guide"


def test_rag_search_top_k_limits_results(seeded_client: TestClient) -> None:
    response = seeded_client.post(
        "/api/v1/rag/search",
        json={"query": "support after stroke", "topK": 1},
    )

    assert response.status_code == 200
    assert len(response.json()["data"]["results"]) == 1


def test_rag_search_empty_index_returns_empty_list(client: TestClient) -> None:
    response = client.post("/api/v1/rag/search", json={"query": "transportation", "topK": 5})

    assert response.status_code == 200
    assert response.json()["data"]["results"] == []


def test_rag_search_rejects_empty_query(client: TestClient) -> None:
    response = client.post("/api/v1/rag/search", json={"query": "   "})

    assert response.status_code == 422
    assert response.json()["success"] is False


def test_source_detail_endpoint_returns_metadata_and_chunks(seeded_client: TestClient) -> None:
    response = seeded_client.get("/api/v1/sources/src_transport_guide")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["sourceId"] == "src_transport_guide"
    assert data["authorityLevel"] == "official_government"
    assert data["chunks"]
    assert data["chunks"][0]["metadata"]["category"] == "transportation"


def test_missing_source_returns_standard_404(client: TestClient) -> None:
    response = client.get("/api/v1/sources/src_missing")

    assert response.status_code == 404
    payload = response.json()
    assert payload["success"] is False
    assert payload["message"] == "Source not found"
