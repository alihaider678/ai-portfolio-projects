from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from agents.state import DrugInteractionState
from core.logger import logger

_SEVERITY_ORDER = {
    "contraindicated": 0,
    "severe": 1,
    "moderate": 2,
    "minor": 3,
    "none": 4,
    "unknown": 5,
}


async def synthesize_results(state: DrugInteractionState) -> dict:
    """
    Synthesis node: aggregates all parallel pair results, computes overall risk,
    then calls GPT-4o for a clinical-grade narrative summary.
    """
    pair_results: list[dict] = state["pair_results"]
    patient: dict = state["patient_profile"]
    api_key: str = state["api_key"]
    request_id: str = state["request_id"]

    logger.info(f"Synthesis START | req={request_id} | pairs={len(pair_results)}")

    # Sort by severity — most critical first
    sorted_results = sorted(
        pair_results,
        key=lambda r: _SEVERITY_ORDER.get(r.get("severity", "unknown"), 5),
    )

    # Count by severity level
    severity_counts: dict[str, int] = {}
    for r in pair_results:
        s = r.get("severity", "unknown")
        severity_counts[s] = severity_counts.get(s, 0) + 1

    # Derive overall risk label
    if severity_counts.get("contraindicated", 0) > 0:
        overall_risk = "HIGH"
        risk_label = "Contraindicated combination(s) present — do not co-administer"
    elif severity_counts.get("severe", 0) > 0:
        overall_risk = "HIGH"
        risk_label = "Severe interaction(s) detected — requires immediate clinical review"
    elif severity_counts.get("moderate", 0) > 0:
        overall_risk = "MODERATE"
        risk_label = "Moderate interaction(s) — monitor closely and consider alternatives"
    elif severity_counts.get("minor", 0) > 0:
        overall_risk = "LOW"
        risk_label = "Minor interaction(s) only — monitor per standard care"
    else:
        overall_risk = "NONE"
        risk_label = "No clinically significant interactions identified"

    # GPT-4o clinical narrative
    results_text = "\n".join(
        f"  • {r['drug_a']} + {r['drug_b']}: {r['severity'].upper()} | {r['mechanism']} | Recommendation: {r['management']}"
        for r in sorted_results
    )

    llm = ChatOpenAI(model="gpt-4o", api_key=api_key, temperature=0)
    try:
        resp = await llm.ainvoke(
            [
                SystemMessage(
                    content="You are a senior clinical pharmacist writing a brief consultation note. "
                            "Be precise, clinical, and actionable. Max 4 sentences."
                ),
                HumanMessage(
                    content=f"""Patient: Age {patient.get('age')}, renal={'impaired' if patient.get('renal_impairment') else 'normal'}, """
                            f"""hepatic={'impaired' if patient.get('hepatic_impairment') else 'normal'}, """
                            f"""pregnant={patient.get('pregnant')}, conditions: {', '.join(patient.get('conditions', [])) or 'none'}.

Interaction findings:
{results_text}

Overall risk: {overall_risk} — {risk_label}

Write a 3–4 sentence clinical synthesis covering: (1) the highest-priority interaction, (2) patient-specific risk factors, (3) your key recommendation."""
                ),
            ]
        )
        clinical_summary = resp.content.strip()
    except Exception as exc:
        logger.warning(f"Synthesis GPT call failed | req={request_id} | err={exc}")
        clinical_summary = f"Overall risk: {overall_risk}. {risk_label}. Review individual pair details below."

    synthesis = {
        "overall_risk": overall_risk,
        "risk_label": risk_label,
        "severity_counts": severity_counts,
        "sorted_results": sorted_results,
        "clinical_summary": clinical_summary,
        "total_pairs": len(pair_results),
    }

    logger.info(f"Synthesis DONE | req={request_id} | risk={overall_risk} | pairs={len(pair_results)}")

    return {"synthesis": synthesis}