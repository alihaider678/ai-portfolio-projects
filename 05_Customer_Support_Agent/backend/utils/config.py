from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str
    openai_model: str = "gpt-4o"
    openai_embedding_model: str = "text-embedding-3-small"
    chroma_persist_dir: str = "./data/chroma_db"
    escalation_threshold: int = 2

    class Config:
        env_file = ".env"


settings = Settings()
