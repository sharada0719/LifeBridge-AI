import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "LifeBridge AI API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-lifebridge-key-change-in-production-1234567890")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database Settings: Default to SQLite for easy local development
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./lifebridge.db")

    class Config:
        case_sensitive = True

settings = Settings()
