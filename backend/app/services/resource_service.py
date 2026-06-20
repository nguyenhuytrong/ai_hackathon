from fastapi import HTTPException, status

from app.db.models import DocumentChunk, Resource, SourceDocument
from app.db.repositories import ResourceRepository, SourceRepository
from app.schemas.resource import ResourceDetail, ResourceSourceCitation, ResourceSummary
from app.seed.resources import seed_resources


class ResourceService:
    def __init__(self, repository: ResourceRepository, source_repository: SourceRepository | None = None):
        self.repository = repository
        self.source_repository = source_repository
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

    def _to_detail(self, resource: Resource) -> ResourceDetail:
        details = resource.details_json
        return ResourceDetail(
            **self._to_summary(resource).model_dump(),
            eligibilityFactors=details.get("eligibilityFactors", []),
            documentsToPrepare=details.get("documentsToPrepare", []),
            steps=details.get("steps", []),
            sources=self._linked_sources(resource.id),
        )

    def _linked_sources(self, resource_id: str) -> list[ResourceSourceCitation]:
        if self.source_repository is None:
            return []

        citations: list[ResourceSourceCitation] = []
        seen_source_ids: set[str] = set()
        chunks = self.source_repository.list_chunks(resource_id=resource_id)
        for chunk in chunks:
            if chunk.source_document_id in seen_source_ids:
                continue
            source = self.source_repository.get_source(chunk.source_document_id)
            if source is None:
                continue
            citations.append(self._to_source_citation(source, chunk))
            seen_source_ids.add(source.id)
        return citations

    @staticmethod
    def _to_source_citation(source: SourceDocument, chunk: DocumentChunk) -> ResourceSourceCitation:
        return ResourceSourceCitation(
            sourceId=source.id,
            title=source.title,
            url=source.source_url,
            sourceType=source.source_type,
            page=chunk.page_number,
            authorityLevel=source.authority_level,
            excerpt=chunk.chunk_text,
        )
