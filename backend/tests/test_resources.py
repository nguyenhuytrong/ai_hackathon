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
def client_with_linked_source() -> Iterator[TestClient]:
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
        chunk_size=12,
        chunk_overlap=0,
    ).ingest_entries(
        [
            SourceManifestEntry.model_validate(
                {
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
            )
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


def test_seeded_resources_are_available_and_idempotent(client: TestClient):
    first = client.get("/api/v1/resources")
    second = client.get("/api/v1/resources")

    assert first.status_code == 200
    assert second.status_code == 200
    resources = first.json()["data"]
    assert len(resources) == 4
    assert len(second.json()["data"]) == 4
    assert {resource["id"] for resource in resources} == {
        "rehab_services",
        "home_health_discussion",
        "transportation_assistance",
        "caregiver_support_programs",
    }


def test_resources_support_category_and_location_filters(client: TestClient):
    response = client.get("/api/v1/resources?category=transportation&state=OH&county=Montgomery")

    assert response.status_code == 200
    resources = response.json()["data"]
    assert [resource["id"] for resource in resources] == ["transportation_assistance"]
    assert resources[0]["location"] == "Montgomery County, OH"


def test_resource_detail_returns_safe_support_pathway_copy(client: TestClient):
    response = client.get("/api/v1/resources/transportation_assistance")

    assert response.status_code == 200
    payload = response.json()
    detail = payload["data"]
    assert payload["message"] == "Resource loaded successfully"
    assert detail["id"] == "transportation_assistance"
    assert detail["category"] == "transportation"
    assert "Transportation difficulty" in detail["eligibilityFactors"]
    assert "Insurance card" in detail["documentsToPrepare"]
    assert "Ask the insurance provider or social worker" in detail["steps"][0]

    text = str(detail).lower()
    assert "you qualify" not in text
    assert "approved" not in text
    assert "guaranteed" not in text
    assert detail["sources"] == []


def test_resource_detail_returns_linked_source_citations(client_with_linked_source: TestClient):
    response = client_with_linked_source.get("/api/v1/resources/transportation_assistance")

    assert response.status_code == 200
    sources = response.json()["data"]["sources"]
    assert sources[0] == {
        "sourceId": "src_transport_guide",
        "title": "Transportation Assistance Guide",
        "url": "https://www.medicaid.gov/medicaid/benefits/non-emergency-medical-transportation/index.html",
        "sourceType": "webpage",
        "page": None,
        "authorityLevel": "official_government",
        "excerpt": sources[0]["excerpt"],
    }
    assert "Transportation support may be available" in sources[0]["excerpt"]


def test_missing_resource_returns_standard_error(client: TestClient):
    response = client.get("/api/v1/resources/unknown_resource")

    assert response.status_code == 404
    payload = response.json()
    assert payload["success"] is False
    assert payload["message"] == "Resource not found"
    assert payload["status"] == 404
    assert payload["path"] == "/api/v1/resources/unknown_resource"
