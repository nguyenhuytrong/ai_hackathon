from app.schemas.rag import RagSearchResult
from app.schemas.recommendation import SourceCitation


class CitationBuilder:
    def build(self, results: list[RagSearchResult], *, max_sources: int = 3) -> list[SourceCitation]:
        citations: list[SourceCitation] = []
        seen: set[str] = set()
        for result in results:
            if result.sourceId in seen:
                continue
            citations.append(
                SourceCitation(
                    sourceId=result.sourceId,
                    title=result.sourceTitle,
                    sourceType=result.authorityLevel,
                    url=result.url,
                    page=result.page,
                    excerpt=result.text[:320],
                )
            )
            seen.add(result.sourceId)
            if len(citations) >= max_sources:
                break
        return citations
