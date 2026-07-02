import structlog
from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar("request_id", default="")


def get_logger(name: str = ""):
    return structlog.get_logger(name)


structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_log_level,
        structlog.processors.JSONRenderer(),
    ]
)