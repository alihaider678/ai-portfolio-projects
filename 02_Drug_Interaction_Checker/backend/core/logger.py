import json
import logging
import time
from contextvars import ContextVar

# Per-request correlation ID — set by middleware, read by all log lines
request_id_var: ContextVar[str] = ContextVar("request_id", default="")


class _JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log: dict = {
            "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "level": record.levelname,
            "request_id": request_id_var.get(""),
            "message": record.getMessage(),
        }
        if record.exc_info:
            log["exception"] = self.formatException(record.exc_info)
        return json.dumps(log)


def _build_logger() -> logging.Logger:
    handler = logging.StreamHandler()
    handler.setFormatter(_JSONFormatter())
    log = logging.getLogger("drug_checker")
    log.setLevel(logging.INFO)
    log.addHandler(handler)
    log.propagate = False
    return log


logger = _build_logger()