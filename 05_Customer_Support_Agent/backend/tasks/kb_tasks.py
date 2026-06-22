import logging
from celery_app import celery_app
from langchain_core.documents import Document
from vectorstore.chroma_store import ingest_documents

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="tasks.kb_tasks.ingest_kb")
def ingest_kb(self, texts: list, metadatas: list) -> dict:
    try:
        self.update_state(state="PROGRESS", meta={"current": 0, "total": len(texts)})
        documents = [Document(page_content=t, metadata=m) for t, m in zip(texts, metadatas)]
        ingest_documents(documents)
        logger.info(f"KB ingestion complete: {len(documents)} chunks")
        return {"status": "success", "chunks_processed": len(documents)}
    except Exception as exc:
        logger.error(f"KB ingestion failed: {exc}")
        raise self.retry(exc=exc, countdown=5, max_retries=3)