import json
from pathlib import Path

from app.schemas.rag import SourceManifestEntry


DEFAULT_MANIFEST_PATH = Path(__file__).with_name("sources.json")


def load_manifest(path: Path = DEFAULT_MANIFEST_PATH) -> list[SourceManifestEntry]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    return [SourceManifestEntry.model_validate(item) for item in payload]


def filter_manifest(
    entries: list[SourceManifestEntry],
    *,
    source_id: str | None = None,
) -> list[SourceManifestEntry]:
    if source_id is None:
        return entries
    return [entry for entry in entries if entry.sourceId == source_id]
