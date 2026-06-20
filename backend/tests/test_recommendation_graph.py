from collections.abc import Iterator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.ai.llm_provider import FakeRecommendationLlmProvider, RecommendationLlmProvider
from app.db.models import Base
from app.db.repositories import (
    RecommendationRunRepository,
    ResourceRepository,
    SessionRepository,
    SourceRepository,
)
from app.rag.ingestion.embeddings import FakeEmbeddingProvider
from app.rag.ingestion.service import IngestionService
from app.schemas.rag import SourceManifestEntry
from app.schemas.recommendation import GenerateRecommendationsRequest
from app.services.recommendation_service import RecommendationService


DEMO_PROFILE = {
    "caregiverName": "John",
    "careRecipient": "Mother",
    "dischargeTime": "less_than_7_days",
    "mobility": "independent",
    "transportation": "no_vehicle",
    "insurance": "medicaid",
    "caregiverWorking": False,
    "caregiverBurden": "low",
    "state": "OH",
    "county": "Montgomery",
    "biggestChallenge": "getting_to_appointments",
}


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
        seed_transportation_source(db)
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_langgraph_workflow_attaches_evidence_and_stores_trace(db_session: Session):
    service, runs = build_service(db_session, FakeRecommendationLlmProvider())
    create_session(db_session, "sess_graph")

    result = service.generate(
        "sess_graph",
        GenerateRecommendationsRequest(includeRagEvidence=True, regenerate=True),
    )

    recommendation = result.recommendations[0]
    assert recommendation.id == "transportation_assistance"
    assert recommendation.evidenceStatus == "partial"
    assert recommendation.sources[0].sourceId == "src_transport_guide"
    assert recommendation.sources[0].excerpt.startswith("Transportation support may be available")

    stored_run = runs.get_latest("sess_graph")
    assert stored_run is not None
    workflow = stored_run.input_snapshot["workflow"]
    assert workflow["graphVersion"] == "phase6-langgraph-v1"
    assert workflow["provider"] == {"name": "fake", "model": "fake-carebridge-recommendations-v1"}
    assert workflow["fallbackReason"] is None
    assert workflow["retrievalQueries"][0]["resourceId"] == "transportation_assistance"
    assert workflow["evidence"][0]["sourceIds"] == ["src_transport_guide"]
    assert "chain" not in str(workflow).lower()
    assert "rawPrompt" not in workflow


def test_provider_output_with_invented_source_id_falls_back(db_session: Session):
    service, runs = build_service(db_session, InventedSourceProvider())
    create_session(db_session, "sess_invented")

    result = service.generate(
        "sess_invented",
        GenerateRecommendationsRequest(includeRagEvidence=True, regenerate=True),
    )

    recommendation = result.recommendations[0]
    assert recommendation.id == "transportation_assistance"
    assert [source.sourceId for source in recommendation.sources] == ["src_transport_guide"]
    assert "made_up_source" not in result.model_dump_json()
    stored_run = runs.get_latest("sess_invented")
    assert stored_run is not None
    assert stored_run.input_snapshot["workflow"]["fallbackReason"] == "generated output failed validation"


def test_provider_output_with_forbidden_certainty_language_falls_back(db_session: Session):
    service, runs = build_service(db_session, ForbiddenLanguageProvider())
    create_session(db_session, "sess_forbidden")

    result = service.generate(
        "sess_forbidden",
        GenerateRecommendationsRequest(includeRagEvidence=True, regenerate=True),
    )

    rendered = result.model_dump_json().lower()
    assert "you qualify" not in rendered
    assert "approved" not in rendered
    stored_run = runs.get_latest("sess_forbidden")
    assert stored_run is not None
    assert stored_run.input_snapshot["workflow"]["fallbackReason"] == "generated output failed validation"


def test_provider_failure_falls_back_to_deterministic_recommendations(db_session: Session):
    service, runs = build_service(db_session, FailingProvider())
    create_session(db_session, "sess_failure")

    result = service.generate(
        "sess_failure",
        GenerateRecommendationsRequest(includeRagEvidence=True, regenerate=True),
    )

    assert [recommendation.id for recommendation in result.recommendations] == ["transportation_assistance"]
    assert result.recommendations[0].evidenceStatus == "partial"
    stored_run = runs.get_latest("sess_failure")
    assert stored_run is not None
    assert stored_run.input_snapshot["workflow"]["fallbackReason"] == "LLM provider unavailable"


def build_service(db: Session, provider: RecommendationLlmProvider):
    sessions = SessionRepository(db)
    resources = ResourceRepository(db)
    runs = RecommendationRunRepository(db)
    service = RecommendationService(
        sessions=sessions,
        resources=resources,
        recommendation_runs=runs,
        sources=SourceRepository(db),
        embedding_provider=FakeEmbeddingProvider(dimensions=16),
        llm_provider=provider,
    )
    return service, runs


def create_session(db: Session, session_id: str) -> None:
    SessionRepository(db).create(session_id=session_id, profile=DEMO_PROFILE, demo_mode=False)


def seed_transportation_source(db: Session) -> None:
    IngestionService(
        repository=SourceRepository(db),
        embedding_provider=FakeEmbeddingProvider(dimensions=16),
        chunk_size=18,
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


class InventedSourceProvider:
    name = "invented"
    model = "invented-test"

    def generate(self, payload: dict) -> dict:
        return {
            **base_generated_payload(),
            "recommendations": [
                {
                    **base_generated_payload()["recommendations"][0],
                    "sources": [
                        {
                            "sourceId": "made_up_source",
                            "title": "Invented Source",
                            "sourceType": "webpage",
                            "url": "https://example.invalid",
                            "page": None,
                            "excerpt": "Made up citation.",
                        }
                    ],
                }
            ],
        }


class ForbiddenLanguageProvider:
    name = "forbidden"
    model = "forbidden-test"

    def generate(self, payload: dict) -> dict:
        return {
            **base_generated_payload(),
            "recommendations": [
                {
                    **base_generated_payload()["recommendations"][0],
                    "whyThisMayFit": ["you qualify and are approved for this support."],
                }
            ],
        }


class FailingProvider:
    name = "failing"
    model = "failing-test"

    def generate(self, payload: dict) -> dict:
        raise RuntimeError("LLM provider unavailable")


def base_generated_payload() -> dict:
    return {
        "summary": "CareBridge found 1 support area worth exploring.",
        "recommendations": [
            {
                "id": "transportation_assistance",
                "title": "Transportation Assistance",
                "category": "transportation",
                "matchStatus": "possible_match",
                "matchedFactors": ["Transportation is a barrier to follow-up care."],
                "missingInformation": [
                    "Confirm whether the insurance plan covers non-emergency medical transportation."
                ],
                "whyThisMayFit": ["Transportation may affect follow-up appointments after discharge."],
                "documentsToPrepare": ["Insurance card", "Appointment date"],
                "nextSteps": [
                    "Ask the insurance provider or social worker about available transportation support."
                ],
                "sources": [
                    {
                        "sourceId": "src_transport_guide",
                        "title": "Transportation Assistance Guide",
                        "sourceType": "webpage",
                        "url": "https://www.medicaid.gov/medicaid/benefits/non-emergency-medical-transportation/index.html",
                        "page": None,
                        "excerpt": "Transportation support may be available for covered medical appointments.",
                    }
                ],
                "evidenceStatus": "partial",
            }
        ],
        "actionPlan": [
            {
                "priority": 1,
                "title": "Ask the insurance provider or social worker about available transportation support.",
                "timeframe": "today",
                "checklist": ["Insurance card", "Appointment date"],
            }
        ],
        "questionsToAsk": {
            "doctor": ["What support should we prioritize after discharge?"],
            "therapist": ["Is home-based therapy worth discussing?"],
            "socialWorker": ["Are transportation services available?"],
            "insuranceProvider": ["Is transportation to rehab covered?"],
        },
    }
