from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.repositories import ResourceRepository
from app.db.session import get_db
from app.schemas.common import ApiSuccess
from app.schemas.resource import ResourceDetail, ResourceSummary
from app.services.resource_service import ResourceService

router = APIRouter()


def get_resource_service(db: Session = Depends(get_db)) -> ResourceService:
    return ResourceService(ResourceRepository(db))


@router.get("", response_model=ApiSuccess[list[ResourceSummary]])
def list_resources(
    category: str | None = None,
    state: str | None = None,
    county: str | None = None,
    q: str | None = None,
    service: ResourceService = Depends(get_resource_service),
):
    return ApiSuccess(
        message="Resources loaded successfully",
        data=service.list_resources(category=category, state=state, county=county, q=q),
    )


@router.get("/{resource_id}", response_model=ApiSuccess[ResourceDetail])
def get_resource(resource_id: str, service: ResourceService = Depends(get_resource_service)):
    return ApiSuccess(
        message="Resource loaded successfully",
        data=service.get_resource(resource_id),
    )
