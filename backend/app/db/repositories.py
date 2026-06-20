from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    DocumentChunk,
    EligibilityRule,
    IntakeSession,
    RecommendationRun,
    RehabSnapshot,
    Resource,
    SourceDocument,
)


class SessionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, *, session_id: str, profile: dict, demo_mode: bool) -> IntakeSession:
        session = IntakeSession(id=session_id, profile_json=profile, demo_mode=demo_mode)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get(self, session_id: str) -> IntakeSession | None:
        return self.db.get(IntakeSession, session_id)

    def update_profile(self, session: IntakeSession, profile: dict) -> IntakeSession:
        session.profile_json = profile
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session


class ResourceRepository:
    def __init__(self, db: Session):
        self.db = db

    def upsert_resource(self, resource: Resource) -> None:
        existing = self.db.get(Resource, resource.id)
        if existing:
            for field in (
                "name",
                "category",
                "description",
                "location_label",
                "state",
                "county",
                "source_type",
                "official_url",
                "active",
                "details_json",
            ):
                setattr(existing, field, getattr(resource, field))
        else:
            self.db.add(resource)

    def replace_rules(self, resource_id: str, rules: list[EligibilityRule]) -> None:
        existing_rules = self.db.scalars(
            select(EligibilityRule).where(EligibilityRule.resource_id == resource_id)
        ).all()
        for rule in existing_rules:
            self.db.delete(rule)
        for rule in rules:
            self.db.add(rule)

    def commit(self) -> None:
        self.db.commit()

    def list_resources(
        self,
        *,
        category: str | None = None,
        state: str | None = None,
        county: str | None = None,
        q: str | None = None,
    ) -> list[Resource]:
        statement = select(Resource).where(Resource.active.is_(True))
        if category:
            statement = statement.where(Resource.category == category)
        if state:
            statement = statement.where(Resource.state == state)
        if county:
            statement = statement.where(Resource.county == county)
        if q:
            statement = statement.where(Resource.name.ilike(f"%{q}%"))
        return list(self.db.scalars(statement).all())

    def get_resource(self, resource_id: str) -> Resource | None:
        return self.db.get(Resource, resource_id)

    def list_rules(self) -> list[EligibilityRule]:
        return list(self.db.scalars(select(EligibilityRule)).all())


class RecommendationRunRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, *, run_id: str, session_id: str, input_snapshot: dict, result_json: dict) -> RecommendationRun:
        run = RecommendationRun(
            id=run_id,
            session_id=session_id,
            input_snapshot=input_snapshot,
            result_json=result_json,
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        return run

    def get_latest(self, session_id: str) -> RecommendationRun | None:
        statement = (
            select(RecommendationRun)
            .where(RecommendationRun.session_id == session_id)
            .order_by(RecommendationRun.created_at.desc())
        )
        return self.db.scalars(statement).first()


class RehabSnapshotRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, snapshot: RehabSnapshot) -> RehabSnapshot:
        self.db.add(snapshot)
        self.db.commit()
        self.db.refresh(snapshot)
        return snapshot

    def get_latest(self, session_id: str) -> RehabSnapshot | None:
        statement = (
            select(RehabSnapshot)
            .where(RehabSnapshot.session_id == session_id)
            .order_by(RehabSnapshot.created_at.desc())
        )
        return self.db.scalars(statement).first()


class SourceRepository:
    def __init__(self, db: Session):
        self.db = db

    def upsert_source(self, source: SourceDocument) -> SourceDocument:
        existing = self.db.get(SourceDocument, source.id)
        if existing:
            for field in (
                "title",
                "source_url",
                "source_type",
                "publisher",
                "authority_level",
                "state",
                "county",
                "category",
                "verified_at",
                "content_hash",
            ):
                setattr(existing, field, getattr(source, field))
            self.db.add(existing)
            return existing
        self.db.add(source)
        return source

    def replace_chunks(self, source_document_id: str, chunks: list[DocumentChunk]) -> None:
        existing_chunks = self.db.scalars(
            select(DocumentChunk).where(DocumentChunk.source_document_id == source_document_id)
        ).all()
        for chunk in existing_chunks:
            self.db.delete(chunk)
        for chunk in chunks:
            self.db.add(chunk)

    def commit(self) -> None:
        self.db.commit()

    def get_source(self, source_id: str) -> SourceDocument | None:
        return self.db.get(SourceDocument, source_id)

    def list_sources(
        self,
        *,
        category: str | None = None,
        state: str | None = None,
        county: str | None = None,
    ) -> list[SourceDocument]:
        statement = select(SourceDocument)
        if category:
            statement = statement.where(SourceDocument.category == category)
        if state:
            statement = statement.where(SourceDocument.state == state)
        if county:
            statement = statement.where(SourceDocument.county == county)
        return list(self.db.scalars(statement).all())

    def list_chunks(
        self,
        *,
        source_document_id: str | None = None,
        resource_id: str | None = None,
        category: str | None = None,
    ) -> list[DocumentChunk]:
        statement = select(DocumentChunk)
        if source_document_id:
            statement = statement.where(DocumentChunk.source_document_id == source_document_id)
        if resource_id:
            statement = statement.where(DocumentChunk.resource_id == resource_id)
        if category:
            statement = statement.where(DocumentChunk.metadata_json["category"].as_string() == category)
        return list(self.db.scalars(statement).all())
