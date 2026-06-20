from uuid import uuid4

from fastapi import HTTPException, status

from app.db.models import IntakeSession
from app.db.repositories import SessionRepository
from app.schemas.session import CreateSessionRequest, IntakeProfile, SessionResponse

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


class SessionService:
    def __init__(self, repository: SessionRepository):
        self.repository = repository

    def create_session(self, request: CreateSessionRequest) -> SessionResponse:
        session = self.repository.create(
            session_id=self._build_id("sess"),
            profile={},
            demo_mode=request.demoMode,
        )
        return self._to_response(session)

    def create_demo_session(self) -> SessionResponse:
        session = self.repository.create(
            session_id=self._build_id("demo"),
            profile=DEMO_PROFILE,
            demo_mode=True,
        )
        return self._to_response(session)

    def get_session(self, session_id: str) -> SessionResponse:
        session = self.repository.get(session_id)
        if session is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        return self._to_response(session)

    def update_intake_profile(self, session_id: str, profile: IntakeProfile) -> SessionResponse:
        session = self.repository.get(session_id)
        if session is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

        updates = profile.model_dump(mode="json", exclude_unset=True, exclude_none=True)
        merged_profile = {**session.profile_json, **updates}
        updated_session = self.repository.update_profile(session, merged_profile)
        return self._to_response(updated_session)

    @staticmethod
    def _build_id(prefix: str) -> str:
        return f"{prefix}_{uuid4().hex[:12]}"

    @staticmethod
    def _to_response(session: IntakeSession) -> SessionResponse:
        return SessionResponse(
            sessionId=session.id,
            profile=session.profile_json,
            createdAt=session.created_at,
            updatedAt=session.updated_at,
        )
