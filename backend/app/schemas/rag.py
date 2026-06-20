from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class SourceManifestEntry(BaseModel):
    sourceId: str = Field(min_length=1)
    title: str = Field(min_length=1)
    sourceUrl: str | None = None
    sourceType: str = Field(min_length=1)
    publisher: str = Field(min_length=1)
    authorityLevel: str = Field(min_length=1)
    state: str | None = None
    county: str | None = None
    category: str = Field(min_length=1)
    resourceId: str | None = None
    content: str | None = None
    sectionTitle: str | None = None
    page: int | None = None

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def require_content_or_url(self) -> "SourceManifestEntry":
        if not self.content and not self.sourceUrl:
            raise ValueError("Either content or sourceUrl is required")
        return self


class DocumentChunkResponse(BaseModel):
    chunkId: str
    sourceId: str
    resourceId: str | None = None
    text: str
    page: int | None = None
    sectionTitle: str | None = None
    metadata: dict


class SourceDocumentResponse(BaseModel):
    sourceId: str
    title: str
    url: str | None = None
    sourceType: str
    publisher: str | None = None
    authorityLevel: str
    state: str | None = None
    county: str | None = None
    category: str
    uploadedAt: datetime
    verifiedAt: datetime | None = None
    contentHash: str
    chunks: list[DocumentChunkResponse] = Field(default_factory=list)


class IngestionRunSummary(BaseModel):
    sourcesProcessed: int = 0
    sourcesChanged: int = 0
    chunksCreated: int = 0
    dryRun: bool = False
    sourceIds: list[str] = Field(default_factory=list)


class RagSearchFilters(BaseModel):
    category: str | None = None
    state: str | None = None
    county: str | None = None
    resourceId: str | None = None
    sourceId: str | None = None

    model_config = ConfigDict(extra="forbid")


class RagSearchRequest(BaseModel):
    query: str = Field(min_length=1)
    filters: RagSearchFilters | None = None
    topK: int = Field(default=5, ge=1, le=10)

    @field_validator("query")
    @classmethod
    def query_must_not_be_blank(cls, value: str) -> str:
        query = value.strip()
        if not query:
            raise ValueError("Query is required")
        return query


class RagSearchSource(BaseModel):
    sourceId: str
    title: str
    url: str | None = None
    page: int | None = None
    authorityLevel: str


class RagSearchResult(BaseModel):
    chunkId: str
    score: float
    text: str
    source: RagSearchSource
    metadata: dict


class RagSearchResponse(BaseModel):
    query: str
    results: list[RagSearchResult]
