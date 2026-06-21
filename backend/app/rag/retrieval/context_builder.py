from app.schemas.rag import RagSearchResult


class RagContextBuilder:
    def build(self, results: list[RagSearchResult], *, max_sources: int = 5, max_chars_per_chunk: int = 1200) -> str:
        context_blocks: list[str] = []
        for index, result in enumerate(results[:max_sources], start=1):
            excerpt = result.text[:max_chars_per_chunk].strip()
            context_blocks.append(
                "\n".join(
                    [
                        f"SOURCE {index}",
                        f"Title: {result.sourceTitle}",
                        f"Publisher: {result.publisher or 'Unknown'}",
                        f"Authority: {result.authorityLevel}",
                        f"URL: {result.url or 'Not provided'}",
                        f"Category: {result.category}",
                        f"Excerpt: {excerpt}",
                    ]
                )
            )
        return "\n\n".join(context_blocks)
