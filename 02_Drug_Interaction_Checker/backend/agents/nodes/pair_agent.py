import json
import re

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from agents.state import DrugInteractionState
from core.drug_cache import get_cached_pair, set_cached_pair
from core.logger import logger
from services.openfda import fetch_drug_interactions
from services.pubmed import search_pubmed

_SYSTEM_PROMPT = """You are a board-certified clinical pharmacologist.
Analyze the drug interaction evidence provided and return ONLY valid JSON — no markdown, no commentary.

Required JSON fields:
{
  "severity": "contraindicated" | "severe" | "moderate" | "minor" | "none",
  "evidence_level": "A" | "B" | "C",
  "mechanism": "<brief pharmacological mechanism>",
  "clinical_effects": "<what happens to the patient>",
  "management": "<clinical recommendation for prescriber>",
  "patient_adjustments": "<any adjustments for patient's age/renal/hepatic/pregnancy>",
  "confidence": <0.0–1.0 based on quality and quantity of evidence>
}

Evidence levels:
  A = RCT or meta-analysis
  B = observational study / case series
  C = theoretical / single case report / FDA label only

Confidence guide:
  < 0.4 = very limited evidence
  0.4–0.69 = moderate evidence
  ≥ 0.7 = strong evidence"""


async def _call_gpt(
    drug_a: str,
    drug_b: str,
    fda_data: dict,
    papers: list[dict],
    patient: dict,
    api_key: str,
) -> dict:
    llm = ChatOpenAI(model="gpt-4o", api_key=api_key, temperature=0)

    fda_text = "\n".join(fda_data.get("interaction_texts", [])) or "No FDA label data available."
    pubmed_text = "\n\n".join(
        [f"PMID {p['pmid']}:\n{p['abstract'][:600]}" for p in papers[:5]]
    ) or "No PubMed studies found."

    human_content = f"""Analyze the interaction between {drug_a.upper()} and {drug_b.upper()}.

Patient context:
  Age: {patient.get('age', 'unknown')}
  Renal impairment: {patient.get('renal_impairment', False)}
  Hepatic impairment: {patient.get('hepatic_impairment', False)}
  Pregnant: {patient.get('pregnant', False)}
  Conditions: {', '.join(patient.get('conditions', [])) or 'none reported'}

FDA drug label evidence ({fda_data.get('label_count', 0)} labels found):
{fda_text}

PubMed evidence ({len(papers)} papers):
{pubmed_text}

Return ONLY valid JSON matching the schema exactly."""

    response = await llm.ainvoke(
        [SystemMessage(content=_SYSTEM_PROMPT), HumanMessage(content=human_content)]
    )

    # Extract JSON robustly — model may wrap in ```json blocks
    text = response.content.strip()
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group())

    raise ValueError(f"No valid JSON in GPT response: {text[:200]}")


async def analyze_pair(state: DrugInteractionState) -> dict:
    """
    Per-pair analysis node — runs in parallel for every drug pair.
    Pipeline:
      1. Redis cache check
      2. OpenFDA query
      3. PubMed search (3 papers)
      4. GPT-4o analysis
      5. Agentic research loop (up to 2 extra rounds if confidence < 0.6)
      6. Cache result
    """
    drug_a, drug_b = state["current_pair"][0], state["current_pair"][1]
    patient = state["patient_profile"]
    api_key = state["api_key"]
    request_id = state["request_id"]

    logger.info(f"Pair analysis START | req={request_id} | pair={drug_a}+{drug_b}")

    # ── 1. Cache check ─────────────────────────────────────────────────────
    cached = await get_cached_pair(drug_a, drug_b)
    if cached:
        cached["patient_adjustments"] = ""  # Will be re-evaluated in synthesis
        return {"pair_results": [cached]}

    # ── 2. OpenFDA ─────────────────────────────────────────────────────────
    try:
        fda_data = await fetch_drug_interactions(drug_a, drug_b)
    except Exception as exc:
        logger.warning(f"OpenFDA skipped | pair={drug_a}+{drug_b} | err={exc}")
        fda_data = {"drug_a": drug_a, "drug_b": drug_b, "interaction_texts": [], "label_count": 0}

    # ── 3. Initial PubMed search ───────────────────────────────────────────
    try:
        papers = await search_pubmed(drug_a, drug_b, max_results=3)
    except Exception:
        papers = []

    # ── 4. Initial GPT-4o analysis ────────────────────────────────────────
    try:
        analysis = await _call_gpt(drug_a, drug_b, fda_data, papers, patient, api_key)
    except Exception as exc:
        logger.error(f"GPT analysis failed | pair={drug_a}+{drug_b} | err={exc}")
        return {
            "pair_results": [
                {
                    "drug_a": drug_a,
                    "drug_b": drug_b,
                    "severity": "unknown",
                    "evidence_level": "C",
                    "mechanism": "Analysis failed — API error",
                    "clinical_effects": "Could not determine",
                    "management": "Consult pharmacist or drug reference",
                    "patient_adjustments": "",
                    "evidence_sources": [],
                    "confidence": 0.0,
                    "cached": False,
                }
            ]
        }

    # ── 5. Agentic research loop ───────────────────────────────────────────
    # If confidence is low, autonomously fetch more PubMed papers and re-analyse.
    # Max 2 extra rounds to avoid infinite loops.
    loop_round = 0
    while float(analysis.get("confidence", 1.0)) < 0.6 and loop_round < 2:
        loop_round += 1
        logger.info(
            f"Research loop round {loop_round} | pair={drug_a}+{drug_b} | confidence={analysis.get('confidence'):.2f}"
        )
        try:
            extra = await search_pubmed(drug_a, drug_b, max_results=3)
            papers = papers + extra
            analysis = await _call_gpt(drug_a, drug_b, fda_data, papers, patient, api_key)
        except Exception as exc:
            logger.warning(f"Research loop failed | round={loop_round} | err={exc}")
            break

    # ── 6. Build result & cache ────────────────────────────────────────────
    result: dict = {
        "drug_a": drug_a,
        "drug_b": drug_b,
        "severity": analysis.get("severity", "unknown"),
        "evidence_level": analysis.get("evidence_level", "C"),
        "mechanism": analysis.get("mechanism", ""),
        "clinical_effects": analysis.get("clinical_effects", ""),
        "management": analysis.get("management", ""),
        "patient_adjustments": analysis.get("patient_adjustments", ""),
        "evidence_sources": list({p["pmid"]: {"pmid": p["pmid"], "url": p["url"]} for p in papers if p["pmid"]}.values()),
        "confidence": float(analysis.get("confidence", 0.5)),
        "cached": False,
    }

    await set_cached_pair(drug_a, drug_b, result)

    logger.info(
        f"Pair analysis DONE | pair={drug_a}+{drug_b} | severity={result['severity']} | confidence={result['confidence']:.2f} | loops={loop_round}"
    )

    return {"pair_results": [result]}