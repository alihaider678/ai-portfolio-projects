import operator
from typing import Annotated, TypedDict


class DrugInteractionState(TypedDict):
    # ── Input ──────────────────────────────────────────────────────────────
    drugs: list[str]
    patient_profile: dict          # age, renal_impairment, hepatic_impairment, pregnant, conditions
    api_key: str
    request_id: str

    # ── Per-Send context (set by decompose for each parallel pair) ─────────
    current_pair: list[str]        # [drug_a, drug_b]

    # ── Accumulated from ALL parallel pair agents ──────────────────────────
    # operator.add merges lists from all parallel executions automatically
    pair_results: Annotated[list[dict], operator.add]

    # ── Final stages ───────────────────────────────────────────────────────
    synthesis: dict | None
    pdf_bytes: bytes | None
    error: str | None