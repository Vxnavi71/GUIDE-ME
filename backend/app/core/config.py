from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parents[2]
_CANONICAL_SQLITE_PATH = (_BACKEND_DIR / "guideme_local.db").as_posix()


class Settings(BaseSettings):
    PROJECT_NAME: str = "GUIDE ME - FINAL"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Security
    SECRET_KEY: str = "guideme-enterprise-super-secret-key-development-2026-replace-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_MIN_LENGTH: int = 8

    # Database Configuration
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/guideme_db"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:5432/guideme_db"
    DATABASE_FALLBACK_SQLITE: bool = True
    DATABASE_SQLITE_URL: str = f"sqlite+aiosqlite:///{_CANONICAL_SQLITE_PATH}"
    DATABASE_SQLITE_URL_SYNC: str = f"sqlite:///{_CANONICAL_SQLITE_PATH}"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_database_url(cls, v: str) -> str:
        if isinstance(v, str) and v.strip():
            v = v.strip()
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql://", 1)
            try:
                from sqlalchemy.engine.url import make_url
                u = make_url(v)
                query = dict(u.query)
                if "sslmode" in query:
                    query["ssl"] = query.pop("sslmode")
                query.pop("channel_binding", None)
                v = u.set(drivername="postgresql+asyncpg", query=query).render_as_string(hide_password=False)
            except Exception:
                if v.startswith("postgresql://") and not v.startswith("postgresql+"):
                    v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @field_validator("DATABASE_URL_SYNC", mode="before")
    @classmethod
    def assemble_sync_database_url(cls, v: str) -> str:
        if isinstance(v, str) and v.strip():
            v = v.strip()
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql://", 1)
            elif v.startswith("postgresql+asyncpg://"):
                v = v.replace("postgresql+asyncpg://", "postgresql://", 1)
        return v

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "capacitor://localhost",
        "http://localhost",
        "https://localhost",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip() and i.strip() != "*"]
        elif isinstance(v, list):
            return [i.strip() for i in v if isinstance(i, str) and i.strip() and i.strip() != "*"]
        elif isinstance(v, str):
            return v
        raise ValueError(v)

    # AI & Integrations
    AI_PROVIDER: str = "gemini"  # "gemini", "mock", "openai"
    AI_MODEL_NAME: str = "gpt-4o-mini"
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"

    WEARABLE_PROVIDER: str = "mock"  # "mock", "fitbit", "apple_health", "google_fit"
    FITBIT_CLIENT_ID: str = ""
    FITBIT_CLIENT_SECRET: str = ""

    # Privacy & Safety
    PRIVACY_ALLOW_RAW_FACIAL_STORAGE: bool = False
    RATE_LIMIT_PER_MINUTE: int = 120
    SAFETY_CRISIS_HOTLINE_DEFAULT: str = "988"
    SAFETY_CRISIS_INTERNATIONAL_INFO: str = "https://findahelpline.com"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()
