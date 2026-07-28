"""
Hybrid (BM25 + dense) retrieval over the Keenu FAQ knowledge base — same fusion
pattern as TariffLens (project 13) for consistency across the portfolio.

Embeddings for the (small, static) FAQ corpus are precomputed once by
build_index.py using an owner key and committed to agent/index/. At query time,
only the incoming visitor question needs to be embedded, using the visitor's
own OpenAI client (BYOK) — the knowledge base itself never triggers an OpenAI
call.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import chromadb
import numpy as np
from rank_bm25 import BM25Okapi

INDEX_DIR = Path(__file__).parent / "index"
RECORDS_FILE = INDEX_DIR / "faq_records.jsonl"
EMBEDDINGS_FILE = INDEX_DIR / "embeddings.npy"

EMBED_MODEL = "text-embedding-3-small"
# Tuned for this corpus's actual scale (a few dozen FAQ entries), not copied from
# TariffLens's ~10k-line HTS corpus: RRF_K=60 and N=8 candidates there are sized for a
# large corpus and flatten out real signal at this size — a doc that's the clear #1
# dense match but absent from BM25's shortlist (or vice versa) should still surface,
# which needs a smaller K and full-corpus candidate coverage (see DENSE_N/SPARSE_N below).
RRF_K = 15

_TOKEN_RE = re.compile(r"[a-z0-9]+")


def _tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall((text or "").lower())


def _rrf(rankings: list[list[int]], k: int = RRF_K) -> dict[int, float]:
    scores: dict[int, float] = {}
    for ranking in rankings:
        for rank, doc_id in enumerate(ranking):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)
    return scores


class KnowledgeBase:
    def __init__(self):
        if not RECORDS_FILE.exists() or not EMBEDDINGS_FILE.exists():
            raise FileNotFoundError(
                "FAQ index not found. Run `python agent/build_index.py` first "
                "(requires OPENAI_API_KEY)."
            )

        self.records: list[dict] = []
        with RECORDS_FILE.open(encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    self.records.append(json.loads(line))

        vectors = np.load(EMBEDDINGS_FILE).astype(np.float32)
        if len(vectors) != len(self.records):
            raise RuntimeError(
                f"Embeddings ({len(vectors)}) don't match records ({len(self.records)}). "
                "Re-run build_index.py."
            )

        self._bm25 = BM25Okapi([_tokenize(r["context"]) for r in self.records])
        self._n = len(self.records)  # candidate breadth = full corpus, since it's tiny

        chroma = chromadb.EphemeralClient()
        self._collection = chroma.create_collection("keenu_faqs", metadata={"hnsw:space": "cosine"})
        ids = [str(i) for i in range(len(vectors))]
        self._collection.add(ids=ids, embeddings=vectors.tolist())

    def _dense(self, query_vector: list[float]) -> list[int]:
        res = self._collection.query(query_embeddings=[query_vector], n_results=self._n)
        return [int(i) for i in res["ids"][0]]

    def _sparse(self, query: str) -> list[int]:
        scores = self._bm25.get_scores(_tokenize(query))
        return sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)

    def retrieve(self, query: str, query_vector: list[float], top_k: int = 5) -> list[dict]:
        """query_vector must already be embedded by the caller (visitor's own OpenAI key)."""
        dense = self._dense(query_vector)
        sparse = self._sparse(query)
        fused = _rrf([dense, sparse])
        ordered = sorted(fused, key=lambda i: fused[i], reverse=True)[:top_k]
        return [
            {**self.records[i], "fusion_score": round(fused[i], 4)}
            for i in ordered
        ]


_kb: KnowledgeBase | None = None


def get_knowledge_base() -> KnowledgeBase:
    global _kb
    if _kb is None:
        _kb = KnowledgeBase()
    return _kb