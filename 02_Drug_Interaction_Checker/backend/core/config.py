from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: str
    pubmed_email: str = "portfolio@demo.dev"
    rate_limit_requests: int = 5
    rate_limit_window: int = 60
    job_ttl: int = 7200        # 2h — jobs expire from Redis
    drug_cache_ttl: int = 21600  # 6h — cached drug pair results

    class Config:
        env_file = ".env"


settings = Settings()