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
    embedding_provider: str = Field(default="fake", validation_alias="EMBEDDING_PROVIDER")
    embedding_model: str = Field(default="fake-carebridge-v1", validation_alias="EMBEDDING_MODEL")
    embedding_dimensions: int = Field(default=64, validation_alias="EMBEDDING_DIMENSIONS")
    embedding_api_key: str | None = Field(default=None, validation_alias="EMBEDDING_API_KEY")

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
