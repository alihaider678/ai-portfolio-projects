"""
Shared config for LicenseGuard.

Loads the local .env (if present), exposes the OpenAI client + model names, and
wires up LangSmith tracing when a key is available (optional — the app works
without it). OPENAI_API_KEY is used for the LLM parsing/classification nodes.
"""
from __future__ import annotations

import os
from pathlib import Path

# LLM used for the parse + product-classification nodes (structured JSON output).
LLM_MODEL = os.environ.get("LICENSEGUARD_LLM_MODEL", "gpt-4o-mini")

# LangSmith project name (traces are grouped under this in smith.langchain.com).
LANGSMITH_PROJECT = os.environ.get("LANGSMITH_PROJECT", "licenseguard")

_ENV_LOADED = False


def load_env() -> None:
    """Minimal .env loader (no extra dependency). Looks in the project root."""
    global _ENV_LOADED
    if _ENV_LOADED:
        return
    for candidate in (
        Path(__file__).parent.parent / ".env",   # project root
        Path(__file__).parent / ".env",           # mcp_server/.env
    ):
        if candidate.exists():
            for line in candidate.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, val = line.partition("=")
                os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))
    _ENV_LOADED = True


def setup_langsmith() -> bool:
    """
    Enable LangSmith tracing if a LANGSMITH_API_KEY (or LANGCHAIN_API_KEY) is
    present. Returns True if tracing is on. Safe no-op otherwise, so the agent
    runs identically with or without observability configured.
    """
    load_env()
    key = os.environ.get("LANGSMITH_API_KEY") or os.environ.get("LANGCHAIN_API_KEY")
    if not key:
        os.environ["LANGCHAIN_TRACING_V2"] = "false"
        return False
    # LangChain reads the LANGCHAIN_* names; mirror the LANGSMITH_* ones onto them.
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_API_KEY"] = key
    os.environ.setdefault("LANGCHAIN_PROJECT", LANGSMITH_PROJECT)
    os.environ.setdefault(
        "LANGCHAIN_ENDPOINT",
        os.environ.get("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com"),
    )
    return True


def get_openai_client(api_key: str | None = None):
    """
    Return an OpenAI client. If `api_key` is provided (e.g. a visitor's own key
    passed from the web UI), it is used for this client only. Otherwise falls
    back to the server's OPENAI_API_KEY. Raises if neither is available.
    """
    load_env()
    from openai import OpenAI

    key = (api_key or "").strip() or os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError(
            "No OpenAI API key available. Provide one in the request, or set "
            "OPENAI_API_KEY in a .env file (see .env.example)."
        )
    return OpenAI(api_key=key)


def has_openai_key(api_key: str | None = None) -> bool:
    """True if a usable key exists (per-request or server-side)."""
    load_env()
    return bool((api_key or "").strip() or os.environ.get("OPENAI_API_KEY"))