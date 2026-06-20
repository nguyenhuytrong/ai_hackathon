from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.repositories import RehabSnapshotRepository, SessionRepository
from app.db.session import get_db
from app.schemas.common import ApiSuccess
from app.schemas.rehab import RehabSnapshotRequest, RehabSnapshotResponse
from app.services.rehab_snapshot_service import RehabSnapshotService

router = APIRouter()


def get_rehab_snapshot_service(db: Session = Depends(get_db)) -> RehabSnapshotService:
    return RehabSnapshotService(
        sessions=SessionRepository(db),
        rehab_snapshots=RehabSnapshotRepository(db),
    )


@router.post("/{session_id}/rehab-snapshot", response_model=ApiSuccess[RehabSnapshotResponse])
def save_rehab_snapshot(
    session_id: str,
    request: RehabSnapshotRequest,
    service: RehabSnapshotService = Depends(get_rehab_snapshot_service),
):
    return ApiSuccess(
        message="Rehab snapshot saved successfully",
        data=service.save_snapshot(session_id, request),
    )
