import logging
from celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.escalation_tasks.notify_escalation")
def notify_escalation(session_id: str, case_id: str, last_message: str) -> dict:
    # Production: send email, create Zendesk ticket, post to Slack webhook, etc.
    logger.info(f"[ESCALATION] Case {case_id} | Session {session_id[:8]}...")
    logger.info(f"[ESCALATION] Customer message: {last_message[:120]}")
    return {"status": "notified", "case_id": case_id}