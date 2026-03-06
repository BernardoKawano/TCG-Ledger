"""Application configuration."""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    app_name: str = "TCG Ledger API"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/tcg_ledger"

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

    # Vision API (Google or AWS)
    google_application_credentials: str | None = None
    use_aws_rekognition: bool = False

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
