from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    database_url: str = "sqlite+aiosqlite:///./dev.db"
    redis_url: str = "redis://localhost:6379/0"

    google_api_key: str = ""
    gemini_model_fast: str = "gemini-2.0-flash-exp"
    gemini_model_full: str = "gemini-2.5-pro"

    meta_app_id: str = ""
    meta_app_secret: str = ""

    sentry_dsn: str = ""

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    secret_key: str
    environment: str = "development"
    debug: bool = False
    enable_handoff: bool = True
    enable_analytics: bool = True
    base_url: str = "http://localhost:8000"
    ssl_certfile: str = ""
    ssl_keyfile: str = ""

    @property
    def jwt_algorithm(self) -> str:
        return "HS256"

    @property
    def jwt_expire_minutes(self) -> int:
        return 60 * 24  # 24 hours


settings = Settings()
