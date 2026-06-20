from pydantic import BaseModel


class ResourceSummary(BaseModel):
    id: str
    name: str
    category: str
    description: str
    location: str | None = None
    sourceType: str
    officialUrl: str | None = None


class ResourceSourceCitation(BaseModel):
    sourceId: str
    title: str
    url: str | None = None
    sourceType: str
    page: int | None = None
    authorityLevel: str
    excerpt: str | None = None


class ResourceDetail(ResourceSummary):
    eligibilityFactors: list[str]
    documentsToPrepare: list[str]
    steps: list[str]
    sources: list[ResourceSourceCitation] = []
