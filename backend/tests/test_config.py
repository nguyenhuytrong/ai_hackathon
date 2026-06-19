from app.core.config import Settings


def test_settings_reads_database_url_from_environment(monkeypatch):
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://carebridge:test@localhost:5432/carebridge",
    )

    settings = Settings()

    assert str(settings.database_url) == (
        "postgresql+psycopg://carebridge:test@localhost:5432/carebridge"
    )
