from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379"
    session_ttl: int = 86400  # 24 hours
    max_interview_turns: int = 8
    chroma_collection: str = "medical_kb"
    interview_model: str = "gpt-4o-mini"
    analysis_model: str = "gpt-4o"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()