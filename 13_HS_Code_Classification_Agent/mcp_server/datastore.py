"""
Loads the normalized HTS records and builds the structures the engine needs:

  * an **index subset** (6- and 8-digit lines — the meaningful classification /
    tariff-line level) used for BOTH retrievers (BM25 keyword + Chroma dense) so
    their result ids line up for fusion, and
  * the **full record set** (all ~30k lines incl. 10-digit statistical splits)
    kept for duty lookups and detail views.

The dense (embedding) side lives in Chroma — see build_index.py / engine.py.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from rank_bm25 import BM25Okapi

DATA_FILE = Path(__file__).parent / "data" / "normalized.jsonl"

# Levels included in the retrieval index (digit counts). 6 = international HS
# subheading, 8 = US tariff/rate line. 10-digit splits stay out of the index but
# remain available for duty resolution.
INDEX_LEVELS = (6, 8)

_TOKEN_RE = re.compile(r"[a-z0-9]+")


def tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall((text or "").lower())


class HTSStore:
    def __init__(self, records: list[dict], index_levels: tuple[int, ...] = INDEX_LEVELS):
        self.all = records
        self._by_code: dict[str, dict] = {}
        for rec in records:
            self._by_code.setdefault(rec["hts_code"], rec)

        # Retrieval subset — position in this list == the id used in Chroma/BM25.
        # Exclude chapters 98 & 99: those are US-specific special provisions (duty
        # suspensions, government imports, etc.), NOT standard HS classification —
        # including them pollutes retrieval with misleading literal matches.
        self.index: list[dict] = [
            r for r in records
            if r["level"] in index_levels and r["chapter"] not in ("98", "99")
        ]
        self._corpus_tokens = [tokenize(r["context"]) for r in self.index]
        self.bm25 = BM25Okapi(self._corpus_tokens)

    # ---- retrieval-subset accessors ----
    def index_size(self) -> int:
        return len(self.index)

    def record_at(self, i: int) -> dict:
        return self.index[i]

    def corpus_texts(self) -> list[str]:
        return [r["context"] for r in self.index]

    def bm25_scores(self, query: str):
        return self.bm25.get_scores(tokenize(query))

    # ---- full-set lookups (all levels) ----
    def get_by_code(self, hts_code: str) -> dict | None:
        code = (hts_code or "").strip()
        if code in self._by_code:
            return self._by_code[code]
        norm = code.replace(".", "")
        for rec in self.all:
            if rec["hts_code"].replace(".", "").startswith(norm):
                return rec
        return None

    def children_with_duty(self, hts_code: str, limit: int = 8) -> list[dict]:
        """Deeper (e.g. 10-digit) lines under a code that carry a duty rate.

        Used when a matched heading/subheading has no duty of its own — the
        applicable rates live on its statistical suffixes."""
        norm = (hts_code or "").replace(".", "")
        kids = [
            r
            for r in self.all
            if r["hts_code"].replace(".", "").startswith(norm)
            and r["hts_code"] != hts_code
            and r.get("duty_general")
        ]
        return kids[:limit]

    def effective_duty(self, rec: dict) -> dict:
        """Return the best duty info for a record: its own, else from children."""
        if rec.get("duty_general"):
            return {
                "duty_general": rec["duty_general"],
                "duty_other": rec.get("duty_other", ""),
                "duty_from": rec["hts_code"],
                "note": "",
            }
        kids = self.children_with_duty(rec["hts_code"])
        if kids:
            rates = sorted({k["duty_general"] for k in kids})
            return {
                "duty_general": " / ".join(rates),
                "duty_other": "",
                "duty_from": ", ".join(k["hts_code"] for k in kids[:3]),
                "note": "Rate varies by statistical suffix (10-digit); see details.",
            }
        return {"duty_general": "", "duty_other": "", "duty_from": "", "note": "No duty rate on this line."}

    def stats(self) -> dict:
        chapters = {r["chapter"] for r in self.all}
        return {
            "total_lines": len(self.all),
            "indexed_lines": len(self.index),
            "with_duty_rate": sum(1 for r in self.all if r.get("duty_general")),
            "chapters": len(chapters),
        }


def load_records(path: Path = DATA_FILE) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(
            f"HTS data not found at {path}. Run `python ingest.py` first to "
            "download and normalize the USITC HTS dataset."
        )
    records = []
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


def load_store(path: Path = DATA_FILE) -> HTSStore:
    return HTSStore(load_records(path))