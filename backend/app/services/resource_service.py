from fastapi import HTTPException, status

from app.db.models import Resource
from app.db.repositories import ResourceRepository
from app.schemas.resource import ResourceDetail, ResourceSummary
from app.seed.resources import seed_resources


class ResourceService:
    def __init__(self, repository: ResourceRepository):
        self.repository = repository
        seed_resources(repository)

    def list_resources(
        self,
        *,
        category: str | None = None,
        state: str | None = None,
        county: str | None = None,
        q: str | None = None,
    ) -> list[ResourceSummary]:
        resources = self.repository.list_resources(category=category, state=state, county=county, q=q)
        return [self._to_summary(resource) for resource in resources]

    def get_resource(self, resource_id: str) -> ResourceDetail:
        resource = self.repository.get_resource(resource_id)
        if resource is None or not resource.active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
        return self._to_detail(resource)

    @staticmethod
    def _to_summary(resource: Resource) -> ResourceSummary:
        return ResourceSummary(
            id=resource.id,
            name=resource.name,
            category=resource.category,
            description=resource.description,
            location=resource.location_label,
            sourceType=resource.source_type,
            officialUrl=resource.official_url,
        )

    @classmethod
    def _to_detail(cls, resource: Resource) -> ResourceDetail:
        details = resource.details_json
        return ResourceDetail(
            **cls._to_summary(resource).model_dump(),
            eligibilityFactors=details.get("eligibilityFactors", []),
            documentsToPrepare=details.get("documentsToPrepare", []),
            steps=details.get("steps", []),
            sources=[],
        )
