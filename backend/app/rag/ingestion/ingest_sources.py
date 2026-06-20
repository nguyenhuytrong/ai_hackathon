import argparse
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.db.models import Base
from app.db.repositories import SourceRepository
from app.db.session import get_db
from app.rag.ingestion.embeddings import build_embedding_provider
from app.rag.ingestion.manifest import DEFAULT_MANIFEST_PATH, filter_manifest, load_manifest
from app.rag.ingestion.service import IngestionService


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest CareBridge RAG source documents.")
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST_PATH)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--source-id")
    parser.add_argument("--fake-embeddings", action="store_true")
    args = parser.parse_args()

    settings = get_settings()
    entries = filter_manifest(load_manifest(args.manifest), source_id=args.source_id)
    db = _dry_run_session() if args.dry_run else next(get_db())
    try:
        service = IngestionService(
            repository=SourceRepository(db),
            embedding_provider=build_embedding_provider(
                provider=settings.embedding_provider,
                model=settings.embedding_model,
                dimensions=settings.embedding_dimensions,
                api_key=settings.embedding_api_key,
                force_fake=args.fake_embeddings,
            ),
        )
        summary = service.ingest_entries(entries, dry_run=args.dry_run)
        print(summary.model_dump_json(indent=2))
    finally:
        db.close()


def _dry_run_session():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)()


if __name__ == "__main__":
    main()
