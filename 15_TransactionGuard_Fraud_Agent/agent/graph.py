"""
TransactionGuard v2 — adaptive fraud investigation agent (LangGraph).
======================================================================

This is the genuinely-agentic core: the agent decides WHICH check to run
next and WHEN it has enough evidence to stop, instead of running a fixed
pipeline and having an LLM narrate the result afterward.

    ingest -> triage_hypothesis -> run_check -> evaluate_evidence ─┬─> retrieve_precedent -> final_verdict -> END
                                        ▲_________________________┘ (loop: pick next check)

BYOK: every LLM/embedding call takes `openai_api_key` from the graph state
(the visitor's own key, or the rate-limited shared demo key chosen by the
caller) — never a key baked into this module or read from a server .env
at call time. See backend/main.py for how the key is selected per request.
"""
from __future__ import annotations

import json
from typing import Any, Optional, TypedDict

from langgraph.graph import StateGraph, END
from openai import OpenAI

from detection import CHECKS, run_check as run_rule_check

ALL_CHECKS = list(CHECKS.keys())
MAX_ITERATIONS = len(ALL_CHECKS)  # natural hard cap: at most one pass per check, ever
MODEL = "gpt-4o"
EMBED_MODEL = "text-embedding-3-small"


class InvestigationState(TypedDict, total=False):
    investigation_id: str
    transaction: dict
    account: dict
    history: list[dict]
    openai_api_key: str
    _db_pool: Any  # asyncpg.Pool, injected by the backend; None in DB-less local runs

    hypothesis: str
    next_check: Optional[str]
    remaining_checks: list[str]
    checks_run: list[str]
    check_results: list[dict]
    iterations: int
    enough_evidence: bool

    precedent: Optional[dict]
    risk_level: str
    action: str
    explanation: str
    reasoning_trail: list[dict]


def _client(state: InvestigationState) -> OpenAI:
    return OpenAI(api_key=state["openai_api_key"])


def _trail(state: InvestigationState, node: str, summary: str, detail: Any = None) -> list[dict]:
    entry = {"node": node, "summary": summary}
    if detail is not None:
        entry["detail"] = detail
    return [*state.get("reasoning_trail", []), entry]


def _llm_json(client: OpenAI, system: str, user: str) -> dict:
    resp = client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        temperature=0,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
    )
    return json.loads(resp.choices[0].message.content)


# ── Nodes ─────────────────────────────────────────────────────────────────

def ingest_transaction(state: InvestigationState) -> dict:
    return {
        "remaining_checks": list(ALL_CHECKS),
        "checks_run": [],
        "check_results": [],
        "iterations": 0,
        "reasoning_trail": _trail(state, "ingest_transaction",
                                   f"Received transaction {state['transaction']['transaction_id']} "
                                   f"for account {state['transaction']['account_id']}."),
    }


TRIAGE_SYSTEM = """You are a fraud-investigation analyst for a digital wallet. You will be shown a \
transaction and a brief account profile. Form a short, concrete initial hypothesis about what \
looks suspicious (if anything), and choose exactly ONE check to run first from the given list — \
the one most likely to confirm or refute your hypothesis. Respond as JSON: \
{"hypothesis": "...", "first_check": "<one of the provided check names>"}"""


def triage_hypothesis(state: InvestigationState) -> dict:
    txn, account = state["transaction"], state["account"]
    client = _client(state)
    user = (
        f"Transaction: {json.dumps(txn)}\n"
        f"Account profile: {json.dumps(account)}\n"
        f"Available checks: {state['remaining_checks']}"
    )
    result = _llm_json(client, TRIAGE_SYSTEM, user)
    first_check = result.get("first_check")
    if first_check not in state["remaining_checks"]:
        first_check = state["remaining_checks"][0]
    return {
        "hypothesis": result.get("hypothesis", ""),
        "next_check": first_check,
        "reasoning_trail": _trail(state, "triage_hypothesis", result.get("hypothesis", ""),
                                   {"chosen_check": first_check}),
    }


def run_check_node(state: InvestigationState) -> dict:
    check_name = state["next_check"]
    result = run_rule_check(check_name, state["transaction"], state["history"])
    result_dict = {
        "check": result.check, "triggered": result.triggered,
        "severity": result.severity, "detail": result.detail, "evidence": result.evidence,
    }
    remaining = [c for c in state["remaining_checks"] if c != check_name]
    return {
        "check_results": [*state["check_results"], result_dict],
        "checks_run": [*state["checks_run"], check_name],
        "remaining_checks": remaining,
        "iterations": state["iterations"] + 1,
        "reasoning_trail": _trail(state, f"check:{check_name}", result.detail, result_dict),
    }


EVALUATE_SYSTEM = """You are a fraud-investigation analyst deciding whether you have enough \
evidence to reach a verdict, or whether you should run one more check first. You will be shown \
your working hypothesis, every check run so far with its result, and which checks are still \
available. Be efficient: stop as soon as the evidence is conclusive (either clearly suspicious or \
clearly clean); only ask for another check when the picture is genuinely ambiguous. Respond as \
JSON: {"enough_evidence": true|false, "reasoning": "...", "next_check": "<a name from the \
available list, or null if enough_evidence is true>"}"""


def evaluate_evidence(state: InvestigationState) -> dict:
    if not state["remaining_checks"]:
        return {
            "enough_evidence": True,
            "reasoning_trail": _trail(state, "evaluate_evidence",
                                       "All available checks have been run — moving to a verdict."),
        }
    client = _client(state)
    user = (
        f"Hypothesis: {state['hypothesis']}\n"
        f"Checks run so far: {json.dumps(state['check_results'])}\n"
        f"Checks still available: {state['remaining_checks']}"
    )
    result = _llm_json(client, EVALUATE_SYSTEM, user)
    enough = bool(result.get("enough_evidence"))
    next_check = result.get("next_check")
    if not enough and next_check not in state["remaining_checks"]:
        next_check = state["remaining_checks"][0]
    return {
        "enough_evidence": enough,
        "next_check": None if enough else next_check,
        "reasoning_trail": _trail(state, "evaluate_evidence", result.get("reasoning", ""),
                                   {"enough_evidence": enough, "next_check": next_check}),
    }


def _route_after_evaluation(state: InvestigationState) -> str:
    if state.get("enough_evidence") or not state.get("remaining_checks") or \
            state["iterations"] >= MAX_ITERATIONS:
        return "retrieve_precedent"
    return "run_check"


async def retrieve_precedent(state: InvestigationState) -> dict:
    db_pool = state.get("_db_pool")
    if db_pool is None:
        return {"precedent": None,
                "reasoning_trail": _trail(state, "retrieve_precedent", "No database configured — skipping precedent lookup.")}

    triggered = [r for r in state["check_results"] if r["triggered"]]
    signal_summary = "; ".join(r["detail"] for r in triggered) or "No rule triggered; transaction looked routine."
    client = _client(state)
    embedding = client.embeddings.create(model=EMBED_MODEL, input=signal_summary).data[0].embedding

    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            select summary, risk_level, action, 1 - (embedding <=> $1::vector) as similarity
            from precedents
            order by embedding <=> $1::vector
            limit 1
            """,
            str(embedding),
        )
    precedent = None
    if row and row["similarity"] > 0.75:
        precedent = {"summary": row["summary"], "risk_level": row["risk_level"],
                     "action": row["action"], "similarity": round(float(row["similarity"]), 3)}
    return {
        "precedent": precedent,
        "reasoning_trail": _trail(
            state, "retrieve_precedent",
            f"Found similar precedent (similarity {precedent['similarity']})" if precedent
            else "No sufficiently similar precedent found.",
            precedent,
        ),
    }


FINAL_SYSTEM = """You are a fraud-investigation analyst delivering a final verdict on a wallet \
transaction. You are given the working hypothesis, every check that was run with its result, and \
any similar precedent case. Weigh all of it and decide a risk level and recommended action. \
Respond as JSON: {"risk_level": "LOW"|"MEDIUM"|"HIGH", "action": "monitor"|"hold"|"escalate", \
"explanation": "2-4 plain-English sentences a non-technical ops reviewer can act on, citing which \
signal(s) drove the decision"}"""


def final_verdict(state: InvestigationState) -> dict:
    client = _client(state)
    user = (
        f"Hypothesis: {state['hypothesis']}\n"
        f"Checks run: {json.dumps(state['check_results'])}\n"
        f"Precedent: {json.dumps(state.get('precedent'))}"
    )
    result = _llm_json(client, FINAL_SYSTEM, user)
    return {
        "risk_level": result.get("risk_level", "LOW"),
        "action": result.get("action", "monitor"),
        "explanation": result.get("explanation", ""),
        "reasoning_trail": _trail(state, "final_verdict", result.get("explanation", ""),
                                   {"risk_level": result.get("risk_level"), "action": result.get("action")}),
    }


async def store_episodic_memory(state: InvestigationState) -> dict:
    """Persist this case as a new precedent so future investigations can find it.
    This is what makes the agent's memory genuinely episodic rather than a static rules engine."""
    db_pool = state.get("_db_pool")
    if db_pool is None:
        return {"reasoning_trail": _trail(state, "store_episodic_memory",
                                           "No database configured — precedent not stored.")}

    triggered = [r for r in state["check_results"] if r["triggered"]]
    signal_summary = "; ".join(r["detail"] for r in triggered) or "No rule triggered; transaction looked routine."
    summary = (f"{signal_summary} Hypothesis: {state['hypothesis']}. "
               f"Verdict: {state['risk_level']} risk, action={state['action']}.")

    client = _client(state)
    embedding = client.embeddings.create(model=EMBED_MODEL, input=summary).data[0].embedding

    async with db_pool.acquire() as conn:
        await conn.execute(
            """
            insert into precedents (investigation_id, account_id, summary, risk_level, action, embedding)
            values ($1, $2, $3, $4, $5, $6::vector)
            """,
            state["investigation_id"], state["transaction"]["account_id"],
            summary, state["risk_level"], state["action"], str(embedding),
        )
    return {"reasoning_trail": _trail(state, "store_episodic_memory",
                                       "Case stored as a precedent for future investigations.")}


def build_graph():
    graph = StateGraph(InvestigationState)
    graph.add_node("ingest_transaction", ingest_transaction)
    graph.add_node("triage_hypothesis", triage_hypothesis)
    graph.add_node("run_check", run_check_node)
    graph.add_node("evaluate_evidence", evaluate_evidence)
    graph.add_node("retrieve_precedent", retrieve_precedent)
    graph.add_node("final_verdict", final_verdict)
    graph.add_node("store_episodic_memory", store_episodic_memory)

    graph.set_entry_point("ingest_transaction")
    graph.add_edge("ingest_transaction", "triage_hypothesis")
    graph.add_edge("triage_hypothesis", "run_check")
    graph.add_edge("run_check", "evaluate_evidence")
    graph.add_conditional_edges("evaluate_evidence", _route_after_evaluation,
                                 {"retrieve_precedent": "retrieve_precedent", "run_check": "run_check"})
    graph.add_edge("retrieve_precedent", "final_verdict")
    graph.add_edge("final_verdict", "store_episodic_memory")
    graph.add_edge("store_episodic_memory", END)

    return graph.compile()


def mermaid() -> str:
    return """graph TD
    ingest_transaction --> triage_hypothesis
    triage_hypothesis --> run_check
    run_check --> evaluate_evidence
    evaluate_evidence -- not enough evidence --> run_check
    evaluate_evidence -- enough evidence --> retrieve_precedent
    retrieve_precedent --> final_verdict
    final_verdict --> store_episodic_memory
    store_episodic_memory --> END"""