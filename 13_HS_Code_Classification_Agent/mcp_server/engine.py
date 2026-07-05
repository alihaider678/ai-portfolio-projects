"""
TariffLens engine — HS-code classification via hybrid RAG.

Pipeline for classify():
  1. DENSE retrieval  — embed the query (OpenAI) and search the Chroma vector
     index of HTS descriptions.
  2. SPARSE retrieval — BM25 keyword search over the same descriptions.
  3. FUSION           — combine both rankings with Reciprocal Rank Fusion (RRF).
  4. RERANK           — an LLM reranker reads the top fused candidates and picks
     the single best HS code, returning a confidence + plain-English
     justification as structured JSON.
  5. DUTY             — attach the applicable duty rate (resolving 10-digit
     statistical suffixes when a line has no rate of its own).

Also exposes get_duty_rate() and get_hs_details() as pure lookups (no LLM/key
needed).
"""
from __future__ import annotations

import json

import chromadb
import numpy as np

from config import (
    COLLECTION,
    EMBEDDINGS_FILE,
    RERANK_MODEL,
    embed_query,
    get_openai_client,
)
from datastore import HTSStore, load_store

RRF_K = 60          # Reciprocal Rank Fusion constant
DENSE_N = 25        # candidates from each retriever
SPARSE_N = 25
FUSE_N = 12         # candidates handed to the LLM reranker


def _rrf(rankings: list[list[int]], k: int = RRF_K) -> dict[int, float]:
    """Reciprocal Rank Fusion: score = sum 1/(k + rank) across rankings."""
    scores: dict[int, float] = {}
    for ranking in rankings:
        for rank, doc_id in enumerate(ranking):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)
    return scores


class TariffEngine:
    def __init__(self, store: HTSStore, collection):
        self.store = store
        self.collection = collection
        self._client = None  # OpenAI, created lazily (classify only)

    # ---------------------------------------------------------------- retrieval
    def _dense(self, query: str) -> list[int]:
        qvec = embed_query(self._openai(), query)
        res = self.collection.query(query_embeddings=[qvec], n_results=DENSE_N)
        return [int(i) for i in res["ids"][0]]

    def _sparse(self, query: str) -> list[int]:
        scores = self.store.bm25_scores(query)
        ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
        return ranked[:SPARSE_N]

    def _openai(self):
        if self._client is None:
            self._client = get_openai_client()
        return self._client

    # ---------------------------------------------------------------- rerank
    def _rerank(self, product: str, candidates: list[dict]) -> dict:
        listing = "\n".join(
            f'{i+1}. HTS {c["hts_code"]} — {c["context"]} '
            f'(duty: {c["duty"]["duty_general"] or "n/a"})'
            for i, c in enumerate(candidates)
        )
        codes = [c["hts_code"] for c in candidates]
        prompt = (
            "You are an expert customs classifier. Choose the single BEST-matching "
            "US HTS code for the product from the numbered candidates below. Consider "
            "the material, construction and use; note that knitted garments (e.g. "
            "t-shirts) differ from woven ones.\n\n"
            f"PRODUCT: {product}\n\nCANDIDATES:\n{listing}\n\n"
            "Rules:\n"
            f"- best_hts_code MUST be copied EXACTLY from this list, with no prefix: {codes}\n"
            "- The justification MUST explain why THAT chosen code fits (be consistent — "
            "do not cite a different code in the justification).\n\n"
            "Respond with JSON: {\"best_hts_code\": \"<exact code from the list>\", "
            "\"confidence\": \"High|Medium|Low\", "
            "\"justification\": \"<1-2 sentences, plain English, citing the key product "
            "features that drove the choice>\", "
            "\"runner_up_codes\": [\"<exact code>\", \"<exact code>\"]}"
        )
        resp = self._openai().chat.completions.create(
            model=RERANK_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0,
        )
        return json.loads(resp.choices[0].message.content)

    # ---------------------------------------------------------------- public
    def classify(self, product: str, top_k: int = 5) -> dict:
        if not product or not product.strip():
            return {"error": "Empty product description."}

        dense = self._dense(product)
        sparse = self._sparse(product)
        fused = _rrf([dense, sparse])
        ordered = sorted(fused, key=lambda i: fused[i], reverse=True)[:FUSE_N]

        candidates = []
        for pos in ordered:
            rec = self.store.record_at(pos)
            candidates.append(
                {
                    "hts_code": rec["hts_code"],
                    "context": rec["context"],
                    "level": rec["level"],
                    "duty": self.store.effective_duty(rec),
                    "fusion_score": round(fused[pos], 4),
                }
            )

        # LLM rerank (falls back to top fused candidate on any failure).
        chosen_code = candidates[0]["hts_code"]
        confidence, justification, runners = "Medium", "", []
        def _norm(code: str) -> str:
            return (code or "").upper().replace("HTS", "").strip()

        try:
            r = self._rerank(product, candidates)
            code = _norm(r.get("best_hts_code"))
            match = next((c["hts_code"] for c in candidates if _norm(c["hts_code"]) == code), None)
            if match:
                chosen_code = match
            confidence = r.get("confidence", "Medium")
            justification = r.get("justification", "")
            runners = [_norm(x) for x in (r.get("runner_up_codes") or [])]
        except Exception as e:  # noqa: BLE001
            justification = f"(Reranker unavailable — showing top fused match.) {e}"

        chosen = next(c for c in candidates if c["hts_code"] == chosen_code)
        return {
            "query": product,
            "country": "US",
            "suggested_hts_code": chosen["hts_code"],
            "hs6": chosen["hts_code"][:7].rstrip("."),
            "description": chosen["context"],
            "confidence": confidence,
            "justification": justification,
            "duty": chosen["duty"],
            "runner_up_codes": runners,
            "candidates": [
                {
                    "hts_code": c["hts_code"],
                    "description": c["context"],
                    "duty_general": c["duty"]["duty_general"],
                    "fusion_score": c["fusion_score"],
                }
                for c in candidates[:top_k]
            ],
        }

    def get_duty_rate(self, hts_code: str) -> dict:
        rec = self.store.get_by_code(hts_code)
        if not rec:
            return {"error": f"No HTS line found for '{hts_code}'."}
        duty = self.store.effective_duty(rec)
        return {
            "hts_code": rec["hts_code"],
            "description": rec["context"],
            "country": "US",
            "general_duty_rate": duty["duty_general"] or "n/a",
            "column2_rate": duty["duty_other"],
            "rate_source_line": duty["duty_from"],
            "note": duty["note"],
        }

    def get_hs_details(self, hts_code: str) -> dict:
        rec = self.store.get_by_code(hts_code)
        if not rec:
            return {"error": f"No HTS line found for '{hts_code}'."}
        kids = self.store.children_with_duty(rec["hts_code"])
        return {
            "hts_code": rec["hts_code"],
            "description": rec["description"],
            "full_context": rec["context"],
            "level": rec["level"],
            "chapter": rec["chapter"],
            "duty_general": rec.get("duty_general", ""),
            "duty_special": rec.get("duty_special", ""),
            "duty_other": rec.get("duty_other", ""),
            "units": rec.get("units", []),
            "statistical_suffixes": [
                {"hts_code": k["hts_code"], "description": k["description"], "duty": k["duty_general"]}
                for k in kids
            ],
        }


def load_engine() -> TariffEngine:
    store = load_store()
    if not EMBEDDINGS_FILE.exists():
        raise FileNotFoundError(
            f"Embeddings not found at {EMBEDDINGS_FILE}. Run `python build_index.py` first."
        )
    vectors = np.load(EMBEDDINGS_FILE).astype(np.float32)
    if len(vectors) != store.index_size():
        raise RuntimeError(
            f"Embeddings ({len(vectors)}) don't match index size ({store.index_size()}). "
            "Re-run build_index.py after any data change."
        )
    # Build an in-memory Chroma collection from the committed embeddings — no
    # re-embedding, no cross-OS persistence issues.
    chroma = chromadb.EphemeralClient()
    collection = chroma.create_collection(COLLECTION, metadata={"hnsw:space": "cosine"})
    ids = [str(i) for i in range(len(vectors))]
    B = 2000
    for i in range(0, len(vectors), B):
        collection.add(ids=ids[i : i + B], embeddings=vectors[i : i + B].tolist())
    return TariffEngine(store, collection)