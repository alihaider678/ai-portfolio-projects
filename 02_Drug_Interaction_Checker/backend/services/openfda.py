import asyncio

import httpx

from core.logger import logger

OPENFDA_BASE = "https://api.fda.gov/drug/label.json"

# Semaphore: FDA allows 240 req/min unauthenticated — cap at 15 concurrent to stay safe
_fda_sem = asyncio.Semaphore(15)


async def fetch_drug_interactions(drug_a: str, drug_b: str) -> dict:
    """
    Query OpenFDA drug labels for interaction mentions between drug_a and drug_b.
    Tries two search angles: drug_a label mentioning drug_b, and vice versa.
    """
    results: list[dict] = []

    queries = [
        f'openfda.generic_name:"{drug_a}"+AND+drug_interactions:"{drug_b}"',
        f'openfda.generic_name:"{drug_b}"+AND+drug_interactions:"{drug_a}"',
        f'drug_interactions:"{drug_a}"+AND+drug_interactions:"{drug_b}"',
    ]

    async with _fda_sem:
        async with httpx.AsyncClient(timeout=12.0) as client:
            for q in queries:
                try:
                    resp = await client.get(f"{OPENFDA_BASE}?search={q}&limit=2")
                    if resp.status_code == 200:
                        hits = resp.json().get("results", [])
                        results.extend(hits)
                        if hits:
                            break  # First angle that returns data is enough
                except Exception as exc:
                    logger.warning(f"OpenFDA query failed | pair={drug_a}+{drug_b} | err={exc}")

    # Extract only the drug_interactions field text to keep payload small
    interaction_texts: list[str] = []
    for r in results:
        texts = r.get("drug_interactions", [])
        if texts:
            interaction_texts.append(texts[0][:1500])  # cap at 1500 chars per label

    logger.info(
        f"OpenFDA | pair={drug_a}+{drug_b} | labels_found={len(results)} | has_interaction_text={bool(interaction_texts)}"
    )

    return {
        "drug_a": drug_a,
        "drug_b": drug_b,
        "interaction_texts": interaction_texts,
        "label_count": len(results),
    }