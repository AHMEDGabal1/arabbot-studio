from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    database_url: str = "postgresql+asyncpg://user:pass@localhost:5432/arabbot"
    redis_url: str = "redis://localhost:6379/0"

    google_api_key: str = ""
    gemini_model_fast: str = "gemini-2.0-flash-exp"
    gemini_model_full: str = "gemini-2.5-pro"

    meta_app_id: str = ""
    meta_app_secret: str = ""

    secret_key: str = "change-me-to-a-long-random-string"
    environment: str = "development"
    base_url: str = "http://localhost:8000"

    @property
    def jwt_algorithm(self) -> str:
        return "HS256"

    @property
    def jwt_expire_minutes(self) -> int:
        return 60 * 24  # 24 hours


settings = Settings()
