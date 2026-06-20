import hashlib
import math
import random
from typing import Protocol


class EmbeddingProvider(Protocol):
    dimensions: int

    def embed(self, text: str) -> list[float]:
        ...


class FakeEmbeddingProvider:
    def __init__(self, dimensions: int = 64):
        self.dimensions = dimensions

    def embed(self, text: str) -> list[float]:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        seed = int.from_bytes(digest[:8], "big")
        generator = random.Random(seed)
        values = [generator.uniform(-1.0, 1.0) for _ in range(self.dimensions)]
        norm = math.sqrt(sum(value * value for value in values)) or 1.0
        return [round(value / norm, 6) for value in values]


class ProviderEmbeddingProvider:
    def __init__(self, provider: str, model: str, dimensions: int, api_key: str | None):
        self.provider = provider
        self.model = model
        self.dimensions = dimensions
        self.api_key = api_key

    def embed(self, text: str) -> list[float]:
        raise RuntimeError(
            f"Embedding provider '{self.provider}' is configured but no provider adapter is implemented yet."
        )


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
    return ProviderEmbeddingProvider(provider=provider, model=model, dimensions=dimensions, api_key=api_key)
