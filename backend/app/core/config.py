from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Adaptive Study Buddy"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "mysql+pymysql://studybuddy:studybuddy@localhost:3306/ai_study_buddy"

    # JWT
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days

    # OpenAI
    OPENAI_BASE_URL: str = "http://127.0.0.1:31415/v1"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "auto"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # File Upload
    MAX_UPLOAD_SIZE_MB: int = 20
    UPLOAD_DIR: str = "uploads"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
