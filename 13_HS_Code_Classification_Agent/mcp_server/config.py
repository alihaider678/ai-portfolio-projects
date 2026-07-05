"""
Shared config: loads the local .env (if present), exposes the OpenAI client and
model names. OPENAI_API_KEY is required (embeddings + LLM reranker).
"""
from __future__ import annotations

import os
from pathlib import Path

# Model choices (overridable via env).
EMBED_MODEL = os.environ.get("TARIFFLENS_EMBED_MODEL", "text-embedding-3-small")
# Reduced embedding dimensionality — text-embedding-3-small supports shortening
# the output vector; 512 keeps the index compact (deploy-friendly) with minimal
# quality loss vs the full 1536.
EMBED_DIM = int(os.environ.get("TARIFFLENS_EMBED_DIM", "512"))
RERANK_MODEL = os.environ.get("TARIFFLENS_RERANK_MODEL", "gpt-4o-mini")

EMBEDDINGS_FILE = Path(__file__).parent / "data" / "embeddings.npy"
COLLECTION = "hts"


def load_env() -> None:
    """Minimal .env loader (no extra dependency). Looks in the project root."""
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


def get_openai_client():
    """Return an OpenAI client, or raise a clear error if the key is missing."""
    load_env()
    from openai import OpenAI

    if not os.environ.get("OPENAI_API_KEY"):
        raise RuntimeError(
            "OPENAI_API_KEY is not set. Add it to a .env file in the project root "
            "(see .env.example) or set it in your environment."
        )
    return OpenAI()


def embed_texts(client, texts: list[str], batch_size: int = 256) -> list[list[float]]:
    """Embed a list of texts with the configured embedding model, batched."""
    out: list[list[float]] = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        resp = client.embeddings.create(model=EMBED_MODEL, input=batch, dimensions=EMBED_DIM)
        out.extend(d.embedding for d in resp.data)
    return out


def embed_query(client, text: str) -> list[float]:
    """Embed a single query string."""
    resp = client.embeddings.create(model=EMBED_MODEL, input=[text], dimensions=EMBED_DIM)
    return resp.data[0].embedding