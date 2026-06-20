from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.repositories import SessionRepository
from app.db.session import get_db
from app.schemas.common import ApiSuccess
from app.schemas.session import CreateSessionRequest, IntakeProfile, SessionResponse
from app.services.session_service import SessionService

router = APIRouter()


def get_session_service(db: Session = Depends(get_db)) -> SessionService:
    return SessionService(SessionRepository(db))


@router.post("", response_model=ApiSuccess[SessionResponse])
def create_session(
    request: CreateSessionRequest,
    service: SessionService = Depends(get_session_service),
):
    return ApiSuccess(
        message="Session created successfully",
        data=service.create_session(request),
    )


@router.get("/{session_id}", response_model=ApiSuccess[SessionResponse])
def get_session(
    session_id: str,
    service: SessionService = Depends(get_session_service),
):
    return ApiSuccess(
        message="Session loaded successfully",
        data=service.get_session(session_id),
    )


@router.patch("/{session_id}/intake", response_model=ApiSuccess[SessionResponse])
def update_intake_profile(
    session_id: str,
    profile: IntakeProfile,
    service: SessionService = Depends(get_session_service),
):
    return ApiSuccess(
        message="Intake profile updated successfully",
        data=service.update_intake_profile(session_id, profile),
    )


@router.post("/demo", response_model=ApiSuccess[SessionResponse])
def create_demo_session(service: SessionService = Depends(get_session_service)):
    return ApiSuccess(
        message="Demo session created successfully",
        data=service.create_demo_session(),
    )
