from uuid import uuid4

from fastapi import HTTPException, status

from app.db.models import RehabSnapshot as RehabSnapshotModel
from app.db.repositories import RehabSnapshotRepository, SessionRepository
from app.schemas.rehab import RehabSnapshot, RehabSnapshotRequest, RehabSnapshotResponse


class RehabSnapshotService:
    def __init__(self, *, sessions: SessionRepository, rehab_snapshots: RehabSnapshotRepository):
        self.sessions = sessions
        self.rehab_snapshots = rehab_snapshots

    def save_snapshot(self, session_id: str, request: RehabSnapshotRequest) -> RehabSnapshotResponse:
        if self.sessions.get(session_id) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

        self.rehab_snapshots.create(
            RehabSnapshotModel(
                id=f"rehab_{uuid4().hex[:12]}",
                session_id=session_id,
                mobility_concern=request.mobilityConcern.value,
                observations_json=request.observations,
                confidence=request.confidence,
                captured_at=request.capturedAt,
            )
        )
        return RehabSnapshotResponse(
            sessionId=session_id,
            rehabSnapshot=RehabSnapshot(
                mobilityConcern=request.mobilityConcern,
                observations=request.observations,
                confidence=request.confidence,
                capturedAt=request.capturedAt,
            ),
            suggestedRecompute=True,
        )

    @staticmethod
    def _to_schema(snapshot: RehabSnapshotModel) -> RehabSnapshot:
        return RehabSnapshot(
            mobilityConcern=snapshot.mobility_concern,
            observations=snapshot.observations_json,
            confidence=snapshot.confidence,
            capturedAt=snapshot.captured_at,
        )
