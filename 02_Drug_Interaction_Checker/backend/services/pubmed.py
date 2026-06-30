import asyncio

import httpx

from core.config import settings
from core.logger import logger

ESEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
EFETCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

# NCBI recommends ≤3 req/s without API key — semaphore enforces this
_pubmed_sem = asyncio.Semaphore(3)

_COMMON_PARAMS = {
    "email": settings.pubmed_email,
    "tool": "DrugInteractionChecker",
}


async def search_pubmed(drug_a: str, drug_b: str, max_results: int = 3) -> list[dict]:
    """
    Search PubMed for studies on drug_a + drug_b interactions.
    Returns a list of dicts: {pmid, abstract, url}.
    """
    query = f"{drug_a}[tiab] AND {drug_b}[tiab] AND (interaction[tiab] OR adverse[tiab])"

    async with _pubmed_sem:
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                # Step 1 — Get PMIDs
                search_resp = await client.get(
                    ESEARCH,
                    params={**_COMMON_PARAMS, "db": "pubmed", "term": query, "retmax": max_results, "retmode": "json"},
                )
                search_resp.raise_for_status()
                ids: list[str] = search_resp.json().get("esearchresult", {}).get("idlist", [])

                if not ids:
                    logger.info(f"PubMed | pair={drug_a}+{drug_b} | no results")
                    return []

                # Step 2 — Fetch plain-text abstracts
                fetch_resp = await client.get(
                    EFETCH,
                    params={**_COMMON_PARAMS, "db": "pubmed", "id": ",".join(ids), "rettype": "abstract", "retmode": "text"},
                )
                fetch_resp.raise_for_status()

                papers = _parse_abstracts(fetch_resp.text, ids)
                logger.info(f"PubMed | pair={drug_a}+{drug_b} | papers={len(papers)}")
                return papers

            except Exception as exc:
                logger.warning(f"PubMed failed | pair={drug_a}+{drug_b} | err={exc}")
                return []


def _parse_abstracts(text: str, ids: list[str]) -> list[dict]:
    """Split PubMed plain-text dump into per-paper dicts."""
    papers: list[dict] = []
    # PubMed plain-text separates records with blank lines between sections
    # Simple approach: split by the PMID marker lines
    sections = [s.strip() for s in text.split("\n\n\n") if s.strip()]
    for i, section in enumerate(sections[: len(ids)]):
        pmid = ids[i] if i < len(ids) else ""
        papers.append(
            {
                "pmid": pmid,
                "abstract": section[:2000],
                "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
            }
        )
    return papers