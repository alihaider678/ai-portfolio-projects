"""
One-time (re-)build of the FAQ knowledge-base embeddings.

Run this locally whenever data/keenu_faqs.json changes:

    python agent/build_index.py

Requires OPENAI_API_KEY in the environment. This is the ONE place in the whole
project that uses an "owner" key rather than a visitor's BYOK key — embedding a
fixed, small (38-item) static FAQ corpus is a one-time build step, not a
per-visitor cost, so it doesn't conflict with the BYOK policy the rest of the
app follows. The output (embeddings.npy + faq_records.jsonl) is committed to
the repo so the deployed backend never needs to call this script itself.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np
from openai import OpenAI

DATA_DIR = Path(__file__).parent.parent / "data"
FAQ_SOURCE = DATA_DIR / "keenu_faqs.json"
INDEX_DIR = Path(__file__).parent / "index"
RECORDS_FILE = INDEX_DIR / "faq_records.jsonl"
EMBEDDINGS_FILE = INDEX_DIR / "embeddings.npy"

EMBED_MODEL = "text-embedding-3-small"


def load_faq_records() -> list[dict]:
    raw = json.loads(FAQ_SOURCE.read_text(encoding="utf-8"))
    records = []
    for group in raw["groups"]:
        category = group["category"]
        for item in group["items"]:
            records.append({
                "category": category,
                "question": item["q"],
                "answer": item["a"],
                "context": f"{category} — {item['q']}\n{item['a']}",
            })
    return records


def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit("Set OPENAI_API_KEY in your environment before running this script.")

    records = load_faq_records()
    print(f"Embedding {len(records)} FAQ entries with {EMBED_MODEL}...")

    client = OpenAI(api_key=api_key)
    texts = [r["context"] for r in records]

    # Batch in one call — corpus is tiny (well under any request-size limit).
    resp = client.embeddings.create(model=EMBED_MODEL, input=texts)
    vectors = np.array([d.embedding for d in resp.data], dtype=np.float32)

    INDEX_DIR.mkdir(exist_ok=True)
    np.save(EMBEDDINGS_FILE, vectors)
    with RECORDS_FILE.open("w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"Wrote {EMBEDDINGS_FILE} ({vectors.shape}) and {RECORDS_FILE}")


if __name__ == "__main__":
    main()