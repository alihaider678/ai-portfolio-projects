from celery import Celery
from utils.config import settings

celery_app = Celery(
    "customer_support",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["tasks.kb_tasks", "tasks.escalation_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)