"""
Build the vector embeddings for TariffLens.

Embeds every indexed HTS description (6- & 8-digit lines, ex. ch. 98/99) with
OpenAI (text-embedding-3-small, 512-dim) and saves them to a compact
`embeddings.npy` aligned to the datastore's index order.

At runtime the engine loads this .npy and builds an in-memory Chroma collection
from it — so there's no re-embedding on deploy and no cross-OS binary-format
risk. Run once after ingest.py (and re-run if the data changes).

    python build_index.py

Requires OPENAI_API_KEY (see .env.example). Cost is trivial (~$0.003).
"""
from __future__ import annotations

import time

import numpy as np

from config import EMBEDDINGS_FILE, embed_texts, get_openai_client
from datastore import load_store


def main() -> None:
    store = load_store()
    records = store.index  # retrieval subset (6- & 8-digit lines, ex. ch 98/99)
    print(f"Loaded {len(store.all):,} HTS lines; embedding {len(records):,} indexed lines.")

    client = get_openai_client()
    texts = [r["context"] for r in records]

    t0 = time.time()
    vectors = embed_texts(client, texts)
    print(f"  embedded in {time.time() - t0:.1f}s")

    arr = np.asarray(vectors, dtype=np.float16)  # float16 keeps the file small
    EMBEDDINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    np.save(EMBEDDINGS_FILE, arr)
    print(f"\nDone. Saved {arr.shape[0]:,} x {arr.shape[1]} embeddings to {EMBEDDINGS_FILE} "
          f"({EMBEDDINGS_FILE.stat().st_size / 1e6:.1f} MB).")


if __name__ == "__main__":
    main()