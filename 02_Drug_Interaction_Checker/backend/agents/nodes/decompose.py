from itertools import combinations

from langgraph.types import Send

from agents.state import DrugInteractionState
from core.logger import logger


def decompose_pairs(state: DrugInteractionState) -> list[Send]:
    """
    Fan-out node: splits N drugs into N*(N-1)/2 pairs and sends one
    Send per pair to the analyze_pair node for parallel execution.
    """
    drugs = state["drugs"]
    pairs = list(combinations(drugs, 2))

    logger.info(
        f"Decomposing | request_id={state['request_id']} | drugs={len(drugs)} | pairs={len(pairs)}"
    )

    return [
        Send(
            "analyze_pair",
            {
                "drugs": drugs,
                "current_pair": list(pair),
                "patient_profile": state["patient_profile"],
                "api_key": state["api_key"],
                "request_id": state["request_id"],
                "pair_results": [],
                "synthesis": None,
                "pdf_bytes": None,
                "error": None,
            },
        )
        for pair in pairs
    ]