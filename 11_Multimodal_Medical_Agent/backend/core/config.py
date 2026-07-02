from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379"
    rate_limit_requests: int = 10
    rate_limit_window: int = 60
    drug_checker_url: str = "https://rxsafe-ai-backend.onrender.com"
    chroma_path: str = "./data/knowledge_base"
    sample_docs_path: str = "./data/sample_docs"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()