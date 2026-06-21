import hashlib
import math
import random
from typing import Protocol

import httpx


class EmbeddingProvider(Protocol):
    dimensions: int

    def embed(self, text: str) -> list[float]:
        ...

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        ...


class FakeEmbeddingProvider:
    """Deterministic local embeddings for tests/dev when no API key is available."""

    def __init__(self, dimensions: int = 64):
        self.dimensions = dimensions

    def embed(self, text: str) -> list[float]:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        seed = int.from_bytes(digest[:8], "big")
        generator = random.Random(seed)
        values = [generator.uniform(-1.0, 1.0) for _ in range(self.dimensions)]
        return _normalize(values)

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return [self.embed(text) for text in texts]


class OpenAIEmbeddingProvider:
    """Small direct OpenAI adapter using httpx, so the project does not need the OpenAI SDK."""

    def __init__(self, *, api_key: str, model: str = "text-embedding-3-small", dimensions: int = 1536):
        self.api_key = api_key
        self.model = model
        self.dimensions = dimensions

    def embed(self, text: str) -> list[float]:
        return self.embed_batch([text])[0]

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        response = httpx.post(
            "https://api.openai.com/v1/embeddings",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={"model": self.model, "input": texts},
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        return [item["embedding"] for item in sorted(payload["data"], key=lambda item: item["index"])]


class UnsupportedEmbeddingProvider:
    def __init__(self, provider: str):
        self.provider = provider
        self.dimensions = 0

    def embed(self, text: str) -> list[float]:
        raise RuntimeError(f"Embedding provider '{self.provider}' is not implemented.")

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        raise RuntimeError(f"Embedding provider '{self.provider}' is not implemented.")


def build_embedding_provider(
    *,
    provider: str,
    model: str,
    dimensions: int,
    api_key: str | None = None,
    force_fake: bool = False,
) -> EmbeddingProvider:
    if force_fake or provider == "fake":
        return FakeEmbeddingProvider(dimensions=dimensions)
    if provider == "openai":
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY or EMBEDDING_API_KEY is required when EMBEDDING_PROVIDER=openai")
        return OpenAIEmbeddingProvider(api_key=api_key, model=model, dimensions=dimensions)
    return UnsupportedEmbeddingProvider(provider)


def _normalize(values: list[float]) -> list[float]:
    norm = math.sqrt(sum(value * value for value in values)) or 1.0
    return [round(value / norm, 6) for value in values]
