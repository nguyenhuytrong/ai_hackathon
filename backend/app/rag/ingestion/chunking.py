import re


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def chunk_text(text: str, *, chunk_size: int = 140, chunk_overlap: int = 20) -> list[str]:
    cleaned = clean_text(text)
    if not cleaned:
        return []

    words = cleaned.split(" ")
    if len(words) <= chunk_size:
        return [cleaned]

    chunks: list[str] = []
    step = max(1, chunk_size - chunk_overlap)
    for start in range(0, len(words), step):
        chunk_words = words[start : start + chunk_size]
        if chunk_words:
            chunks.append(" ".join(chunk_words))
        if start + chunk_size >= len(words):
            break
    return chunks
