"""
WalletAssist — bill-payment / wallet support agent (LangGraph).
=================================================================

Genuinely agentic routing, not a fixed pipeline: the agent reads the message
and decides which of three paths fits — general product knowledge (RAG),
an account-specific lookup (tool call), or a case it should honestly hand off
to a human — rather than always running every path and narrating a result.

    classify_intent ─┬─ escalation ──────────────────────────► escalation_check ─► END
                      ├─ faq ──────────────► retrieve_knowledge ─► compose_response ─► END
                      └─ account_specific ─┬─ ambiguous ──────► needs_clarification ─► END
                                            └─ resolvable ─────► lookup_transaction ─► compose_response ─► END

BYOK: every LLM/embedding call takes `openai_api_key` from the graph state
(the visitor's own key, or the rate-limited shared demo key) — never a key
baked into this module. See backend/main.py for key selection per request.
"""
from __future__ import annotations

import json
import re
from typing import Any, Callable, Optional, TypedDict

from langgraph.graph import StateGraph, END
from openai import OpenAI

from knowledge_base import get_knowledge_base

MODEL = "gpt-4o"
EMBED_MODEL = "text-embedding-3-small"

TXN_ID_RE = re.compile(r"TXN-\d{4}-\d{3}", re.IGNORECASE)


class ChatState(TypedDict, total=False):
    session_id: str
    message: str
    history: list[dict]          # [{"role": "user"|"assistant", "content": "..."}]
    account_id: Optional[str]    # the mock account the visitor is "logged in" as, if any
    openai_api_key: str
    _lookup_transaction: Callable[..., Optional[dict]]  # injected by the backend

    intent: str                  # "faq" | "account_specific" | "escalation"
    extracted_transaction_id: Optional[str]
    ambiguous: bool
    clarification_question: Optional[str]

    retrieved_faqs: list[dict]
    transaction_result: Optional[dict]

    response: str
    path_taken: str              # "faq" | "tool" | "escalation" | "clarification"
    reasoning_trail: list[dict]


def _client(state: ChatState) -> OpenAI:
    return OpenAI(api_key=state["openai_api_key"])


def _trail(state: ChatState, node: str, summary: str, detail: Any = None) -> list[dict]:
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

CLASSIFY_SYSTEM = """You are a triage assistant for a digital wallet's customer support agent. \
Read the user's message (and short recent history) and classify it into exactly one intent:

- "faq": a general product/how-it-works question (e.g. "how do I split a bill", "what are the \
transaction limits", "how do top-ups work").
- "account_specific": a question about a specific transaction or the user's own account activity \
(e.g. "why did my last payment fail", "check transaction TXN-0007-003", "is my transfer done").
- "escalation": something a support bot should NOT try to resolve itself — a disputed/unauthorized \
charge, a fraud report, a lost/stolen device/SIM being actively exploited, or a request to speak to \
a human. Be honest here rather than pretending a lookup can fix it.

Also try to extract an explicit transaction ID if the message contains one (format like TXN-0007-003). \
Respond as JSON: {"intent": "faq"|"account_specific"|"escalation", "transaction_id": "<id or null>", \
"reasoning": "one short sentence"}"""


def classify_intent(state: ChatState) -> dict:
    client = _client(state)
    history_text = "\n".join(f"{h['role']}: {h['content']}" for h in state.get("history", [])[-4:])
    user = (
        f"Recent conversation:\n{history_text or '(none)'}\n\n"
        f"Current message: {state['message']}\n"
        f"Account context known: {state.get('account_id') or 'none — visitor has not selected an account'}"
    )
    result = _llm_json(client, CLASSIFY_SYSTEM, user)
    intent = result.get("intent", "faq")
    if intent not in ("faq", "account_specific", "escalation"):
        intent = "faq"

    txn_id = result.get("transaction_id")
    regex_match = TXN_ID_RE.search(state["message"])
    if regex_match:
        txn_id = regex_match.group(0).upper()
    elif txn_id:
        txn_id = txn_id.upper()

    ambiguous = intent == "account_specific" and not txn_id and not state.get("account_id")

    return {
        "intent": intent,
        "extracted_transaction_id": txn_id,
        "ambiguous": ambiguous,
        "reasoning_trail": _trail(state, "classify_intent", result.get("reasoning", ""),
                                   {"intent": intent, "transaction_id": txn_id, "ambiguous": ambiguous}),
    }


def _route_after_classify(state: ChatState) -> str:
    if state["intent"] == "escalation":
        return "escalation_check"
    if state["intent"] == "account_specific":
        return "needs_clarification" if state["ambiguous"] else "lookup_transaction"
    return "retrieve_knowledge"


def retrieve_knowledge(state: ChatState) -> dict:
    client = _client(state)
    query_vector = client.embeddings.create(model=EMBED_MODEL, input=state["message"]).data[0].embedding
    faqs = get_knowledge_base().retrieve(state["message"], query_vector, top_k=5)
    return {
        "retrieved_faqs": faqs,
        "path_taken": "faq",
        "reasoning_trail": _trail(state, "retrieve_knowledge",
                                   f"Retrieved {len(faqs)} relevant FAQ passage(s).",
                                   [{"question": f["question"], "score": f["fusion_score"]} for f in faqs]),
    }


async def lookup_transaction(state: ChatState) -> dict:
    lookup = state["_lookup_transaction"]  # async callable, injected by the backend (db.get_transaction)
    txn = await lookup(transaction_id=state.get("extracted_transaction_id"), account_id=state.get("account_id"))
    return {
        "transaction_result": txn,
        "path_taken": "tool",
        "reasoning_trail": _trail(
            state, "lookup_transaction",
            f"Looked up transaction {txn['transaction_id']} (status: {txn['status']})." if txn
            else "No matching transaction found.",
            txn,
        ),
    }


def needs_clarification(state: ChatState) -> dict:
    question = (
        "Happy to check that for you — could you share the transaction ID (looks like "
        "TXN-XXXX-XXX) or select which account you're asking about?"
    )
    return {
        "clarification_question": question,
        "response": question,
        "path_taken": "clarification",
        "reasoning_trail": _trail(state, "needs_clarification",
                                   "Account-specific question with no transaction ID or account "
                                   "context available — asking a follow-up instead of guessing."),
    }


ESCALATION_SYSTEM = """You are a wallet support agent. The user's message needs a human, not a bot \
(disputed/unauthorized charge, fraud, active device compromise, or an explicit request for a human). \
Write a short, empathetic 2-3 sentence response acknowledging the issue, telling them it's being \
escalated to a human support agent, and — if the message suggests active fraud/theft — advising \
them to also call Keenu's support line immediately. Do not attempt to resolve the issue yourself."""


def escalation_check(state: ChatState) -> dict:
    client = _client(state)
    resp = client.chat.completions.create(
        model=MODEL, temperature=0.3,
        messages=[{"role": "system", "content": ESCALATION_SYSTEM},
                  {"role": "user", "content": state["message"]}],
    )
    text = resp.choices[0].message.content
    return {
        "response": text,
        "path_taken": "escalation",
        "reasoning_trail": _trail(state, "escalation_check",
                                   "Flagged for human handoff rather than attempting to resolve it."),
    }


COMPOSE_SYSTEM = """You are WalletAssist, a friendly, concise customer support agent for a digital \
wallet. Synthesize the given information into a natural, plain-English answer — never dump raw JSON \
or a raw FAQ paragraph verbatim. Keep it to 2-4 sentences unless steps are involved, in which case \
use a short numbered list. If a transaction lookup shows a failure, explain the reason in plain terms \
and what (if anything) the user should do next."""


def compose_response(state: ChatState) -> dict:
    client = _client(state)
    if state.get("retrieved_faqs"):
        context = "\n\n".join(f"Q: {f['question']}\nA: {f['answer']}" for f in state["retrieved_faqs"])
        user = f"User question: {state['message']}\n\nRelevant FAQ content:\n{context}"
    elif state.get("transaction_result"):
        user = f"User question: {state['message']}\n\nTransaction data:\n{json.dumps(state['transaction_result'])}"
    else:
        user = (f"User question: {state['message']}\n\nNo matching transaction was found for this "
                f"account/ID — let them know clearly and suggest double-checking the transaction ID.")

    resp = client.chat.completions.create(
        model=MODEL, temperature=0.3,
        messages=[{"role": "system", "content": COMPOSE_SYSTEM}, {"role": "user", "content": user}],
    )
    text = resp.choices[0].message.content
    return {
        "response": text,
        "reasoning_trail": _trail(state, "compose_response", "Synthesized final answer."),
    }


def build_graph():
    graph = StateGraph(ChatState)
    graph.add_node("classify_intent", classify_intent)
    graph.add_node("retrieve_knowledge", retrieve_knowledge)
    graph.add_node("lookup_transaction", lookup_transaction)
    graph.add_node("needs_clarification", needs_clarification)
    graph.add_node("compose_response", compose_response)
    graph.add_node("escalation_check", escalation_check)

    graph.set_entry_point("classify_intent")
    graph.add_conditional_edges("classify_intent", _route_after_classify, {
        "escalation_check": "escalation_check",
        "needs_clarification": "needs_clarification",
        "lookup_transaction": "lookup_transaction",
        "retrieve_knowledge": "retrieve_knowledge",
    })
    graph.add_edge("retrieve_knowledge", "compose_response")
    graph.add_edge("lookup_transaction", "compose_response")
    graph.add_edge("compose_response", END)
    graph.add_edge("needs_clarification", END)
    graph.add_edge("escalation_check", END)

    return graph.compile()


def mermaid() -> str:
    return """graph TD
    classify_intent -- faq --> retrieve_knowledge
    classify_intent -- account_specific, resolvable --> lookup_transaction
    classify_intent -- account_specific, ambiguous --> needs_clarification
    classify_intent -- escalation --> escalation_check
    retrieve_knowledge --> compose_response
    lookup_transaction --> compose_response
    compose_response --> END
    needs_clarification --> END
    escalation_check --> END"""