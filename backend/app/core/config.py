from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CareBridge Navigator API"
    app_version: str = "0.1.0"
    api_prefix: str = "/api/v1"
    database_url: str = Field(
        default="postgresql+psycopg://carebridge:carebridge_dev@localhost:5432/carebridge",
        validation_alias="DATABASE_URL",
    )
    backend_cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    embedding_provider: str = "fake"
    embedding_model: str = "fake-carebridge-v1"
    embedding_dimensions: int = 64
    embedding_api_key: str | None = None
    llm_provider: str = "fake"
    llm_model: str = "fake-carebridge-recommendations-v1"
    llm_temperature: float = 0
    llm_api_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
