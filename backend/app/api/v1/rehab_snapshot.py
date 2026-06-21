from fastapi import APIRouter, Depends

from app.schemas.common import ApiSuccess
from app.schemas.rehab_snapshot import RehabSnapshotReport, RehabSnapshotReportRequest
from app.services.rehab_snapshot_service import RehabSnapshotService

router = APIRouter()


def get_rehab_snapshot_service() -> RehabSnapshotService:
    return RehabSnapshotService()


@router.post("/report", response_model=ApiSuccess[RehabSnapshotReport])
def generate_rehab_snapshot_report(
    request: RehabSnapshotReportRequest,
    service: RehabSnapshotService = Depends(get_rehab_snapshot_service),
):
    return ApiSuccess(
        message="Rehab snapshot report generated successfully",
        data=service.generate_report(request),
    )
