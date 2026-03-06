"""Application configuration."""
from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    app_name: str = "TCG Ledger API"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/tcg_ledger"

    # CORS (comma-separated origins; "*" when debug)
    cors_origins: str = ""

    # JWT
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # OAuth (optional, for mobile)
    google_client_id: str | None = None
    apple_client_id: str | None = None

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Storage (S3-compatible)
    s3_endpoint_url: str | None = None
    s3_bucket: str = "tcg-ledger-scans"
    s3_region: str = "us-east-1"
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None

    # Upload
    max_upload_bytes: int = 10 * 1024 * 1024  # 10MB

    # Vision API (Google or AWS)
    google_application_credentials: str | None = None
    use_aws_rekognition: bool = False

    @property
    def cors_allow_origins(self) -> List[str]:
        """CORS allowed origins. ['*'] when debug, else from cors_origins env."""
        if self.debug:
            return ["*"]
        if self.cors_origins:
            return [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        return ["http://localhost:8081", "http://localhost:19006"]  # Expo defaults

    def validate_secret_key(self) -> None:
        """Raise if SECRET_KEY is default in production."""
        if not self.debug and "change-me" in self.secret_key.lower():
            raise ValueError(
                "SECRET_KEY must be changed in production. Use: openssl rand -hex 32"
            )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


def get_settings_uncached() -> Settings:
    get_settings.cache_clear()
    return get_settings()


settings = get_settings()
