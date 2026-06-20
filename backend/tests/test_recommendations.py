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


def create_session_with_profile(client: TestClient, profile: dict) -> str:
    response = client.post("/api/v1/sessions", json={"demoMode": False})
    session_id = response.json()["data"]["sessionId"]
    client.patch(f"/api/v1/sessions/{session_id}/intake", json=profile)
    return session_id


DEMO_PROFILE = {
    "caregiverName": "John",
    "careRecipient": "Mother",
    "dischargeTime": "less_than_7_days",
    "mobility": "needs_some_assistance",
    "transportation": "no_vehicle",
    "insurance": "medicaid",
    "caregiverWorking": True,
    "caregiverBurden": "elevated",
    "state": "OH",
    "county": "Montgomery",
    "biggestChallenge": "getting_to_appointments",
}


@pytest.fixture()
def client_with_rag_source() -> Iterator[TestClient]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    seed_db = TestingSessionLocal()
    seed_rag_source(seed_db)
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


def test_demo_profile_generates_and_stores_recommendation_run(client: TestClient):
    session_response = client.post("/api/v1/sessions/demo")
    session_id = session_response.json()["data"]["sessionId"]

    response = client.post(
        f"/api/v1/sessions/{session_id}/recommendations",
        json={"includeRagEvidence": False, "regenerate": True},
    )

    assert response.status_code == 200
    payload = response.json()
    data = payload["data"]
    assert payload["message"] == "Recommendations generated successfully"
    assert data["runId"].startswith("rec_")
    assert {recommendation["id"] for recommendation in data["recommendations"]} == {
        "rehab_services",
        "transportation_assistance",
        "caregiver_support_programs",
    }
    assert data["disclaimer"] == (
        "CareBridge does not determine final eligibility, provide medical advice, "
        "or replace healthcare professionals."
    )

    latest = client.get(f"/api/v1/sessions/{session_id}/recommendations/latest")
    assert latest.status_code == 200
    assert latest.json()["data"]["runId"] == data["runId"]


def test_transportation_barrier_creates_transportation_match(client: TestClient):
    session_id = create_session_with_profile(
        client,
        {
            **DEMO_PROFILE,
            "mobility": "independent",
            "transportation": "cannot_drive",
            "caregiverBurden": "low",
            "caregiverWorking": False,
        },
    )

    response = client.post(f"/api/v1/sessions/{session_id}/recommendations", json={})

    recommendations = response.json()["data"]["recommendations"]
    assert [recommendation["id"] for recommendation in recommendations] == ["transportation_assistance"]
    assert recommendations[0]["matchStatus"] == "possible_match"
    assert "Transportation is a barrier to follow-up care." in recommendations[0]["matchedFactors"]


def test_substantial_mobility_creates_rehab_and_home_health_matches(client: TestClient):
    session_id = create_session_with_profile(
        client,
        {
            **DEMO_PROFILE,
            "mobility": "needs_substantial_assistance",
            "transportation": "available",
            "caregiverBurden": "low",
            "caregiverWorking": False,
        },
    )

    response = client.post(f"/api/v1/sessions/{session_id}/recommendations", json={})

    recommendations = response.json()["data"]["recommendations"]
    assert [recommendation["id"] for recommendation in recommendations] == [
        "rehab_services",
        "home_health_discussion",
    ]
    assert recommendations[0]["matchStatus"] == "likely_match"
    assert recommendations[1]["matchStatus"] == "possible_match"


def test_elevated_caregiver_burden_creates_caregiver_support_match(client: TestClient):
    session_id = create_session_with_profile(
        client,
        {
            **DEMO_PROFILE,
            "mobility": "independent",
            "transportation": "available",
            "caregiverBurden": "high",
            "caregiverWorking": False,
        },
    )

    response = client.post(f"/api/v1/sessions/{session_id}/recommendations", json={})

    recommendations = response.json()["data"]["recommendations"]
    assert [recommendation["id"] for recommendation in recommendations] == ["caregiver_support_programs"]
    assert recommendations[0]["matchStatus"] == "possible_match"


def test_missing_information_returns_more_info_needed(client: TestClient):
    session_id = create_session_with_profile(client, {"state": "OH", "county": "Montgomery"})

    response = client.post(f"/api/v1/sessions/{session_id}/recommendations", json={})

    recommendations = response.json()["data"]["recommendations"]
    assert [recommendation["id"] for recommendation in recommendations] == [
        "rehab_services",
        "transportation_assistance",
        "caregiver_support_programs",
    ]
    assert {recommendation["matchStatus"] for recommendation in recommendations} == {"more_info_needed"}
    assert any(
        "Tell CareBridge whether transportation is a barrier." in recommendation["missingInformation"]
        for recommendation in recommendations
    )


def test_missing_session_recommendations_return_standard_error(client: TestClient):
    response = client.post("/api/v1/sessions/sess_missing/recommendations", json={})

    assert response.status_code == 404
    payload = response.json()
    assert payload["success"] is False
    assert payload["message"] == "Session not found"
    assert payload["path"] == "/api/v1/sessions/sess_missing/recommendations"


def test_recommendations_include_rag_source_snippets_when_requested(client_with_rag_source: TestClient):
    session_id = create_session_with_profile(
        client_with_rag_source,
        {
            **DEMO_PROFILE,
            "mobility": "independent",
            "caregiverBurden": "low",
            "caregiverWorking": False,
        },
    )

    response = client_with_rag_source.post(
        f"/api/v1/sessions/{session_id}/recommendations",
        json={"includeRagEvidence": True, "regenerate": True},
    )

    recommendation = response.json()["data"]["recommendations"][0]
    assert recommendation["id"] == "transportation_assistance"
    assert recommendation["evidenceStatus"] == "partial"
    assert recommendation["sources"][0]["sourceId"] == "src_transport_guide"
    assert recommendation["sources"][0]["excerpt"].startswith("Transportation support may be available")


def test_recommendations_keep_insufficient_evidence_when_chunks_do_not_match(client: TestClient):
    session_id = create_session_with_profile(
        client,
        {
            **DEMO_PROFILE,
            "mobility": "independent",
            "caregiverBurden": "low",
            "caregiverWorking": False,
        },
    )

    response = client.post(
        f"/api/v1/sessions/{session_id}/recommendations",
        json={"includeRagEvidence": True, "regenerate": True},
    )

    recommendation = response.json()["data"]["recommendations"][0]
    assert recommendation["sources"] == []
    assert recommendation["evidenceStatus"] == "insufficient"


def seed_rag_source(db: Session) -> None:
    IngestionService(
        repository=SourceRepository(db),
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
