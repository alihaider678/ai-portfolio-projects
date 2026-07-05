"""
LicenseGuard — LangGraph agent
==============================

The orchestration core. A LangGraph state graph turns an export-license question
into an *auditable, branching* decision:

    parse_query
        │
    check_country_status   ← MCP tool (or in-process engine)
        │
    classify_control_category  ← MCP tool (or in-process engine)
        │
    combine_and_decide
        ├── PROHIBITED       → explain_prohibited ─┐
        ├── LICENSE_REQUIRED → explain_required   ─┤→ END
        └── NOT_REQUIRED     → explain_clear      ─┘

Every node appends to a `trace` list, so the UI can render the reasoning
step-by-step instead of showing a single black-box answer. When a LANGSMITH key
is present, the whole run is traced to LangSmith automatically.

The graph is parametrised by a `tools` backend (see tools.py) — the same graph
runs over the in-process engine (web app) or over MCP (agent demo).
"""
from __future__ import annotations

import json
import operator
import os
import sys
from pathlib import Path
from typing import Annotated, Any, TypedDict

from langgraph.graph import END, StateGraph

MCP_SERVER_DIR = Path(__file__).parent.parent / "mcp_server"
if str(MCP_SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(MCP_SERVER_DIR))

from config import LLM_MODEL, load_env, setup_langsmith  # noqa: E402
from rules_engine import (  # noqa: E402
    NOT_REQUIRED, PROHIBITED, combine_and_decide, generate_explanation,
)


class AgentState(TypedDict, total=False):
    query: str
    product: str
    country: str
    api_key: str  # optional per-request OpenAI key (visitor's own)
    country_status: dict
    product_classification: dict
    decision: dict
    outcome: str
    outcome_label: str
    explanation: str
    trace: Annotated[list, operator.add]


def _entry(step: str, title: str, detail: str, data: Any = None) -> dict:
    return {"step": step, "title": title, "detail": detail, "data": data}


# ── Node 1: parse the request into (product, destination) ──────────────────
def _llm_parse(query: str, api_key: str | None = None) -> tuple[str, str]:
    from config import get_openai_client
    client = get_openai_client(api_key)
    resp = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content":
             "Extract the product/technology being exported and the destination "
             "country from the user's question. Respond with ONLY JSON: "
             '{"product": <string>, "country": <string>}.'},
            {"role": "user", "content": query},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )
    data = json.loads(resp.choices[0].message.content)
    return (data.get("product") or "").strip(), (data.get("country") or "").strip()


def make_parse_node():
    def parse_query(state: AgentState) -> dict:
        product = (state.get("product") or "").strip()
        country = (state.get("country") or "").strip()
        query = (state.get("query") or "").strip()
        api_key = state.get("api_key") or ""

        if product and country:
            detail = "Product and destination supplied directly."
        elif query:
            try:
                from config import has_openai_key
                if has_openai_key(api_key):
                    p, c = _llm_parse(query, api_key)
                    product = product or p
                    country = country or c
                    detail = f"Extracted from free-text query via {LLM_MODEL}."
                else:
                    product = product or query
                    detail = "No LLM key — treated the whole query as the product."
            except Exception as e:  # noqa: BLE001
                product = product or query
                detail = f"Parse fell back to raw query ({e})."
        else:
            detail = "No query provided."

        return {
            "product": product,
            "country": country,
            "trace": [_entry("parse_query", "Parse request", detail,
                             {"product": product, "country": country})],
        }
    return parse_query


# ── Node 2: destination country check (tool call) ──────────────────────────
def make_country_node(tools):
    def check_country_status(state: AgentState) -> dict:
        cs = tools.check_country(state.get("country", ""))
        level = cs.get("level", "unrestricted")
        detail = (f"{cs.get('country')} → {level}"
                  + (f" · {cs.get('program')}" if cs.get("program") else ""))
        return {
            "country_status": cs,
            "trace": [_entry("check_country_status",
                             f"Check destination ({tools.backend_kind} tool)",
                             detail, cs)],
        }
    return check_country_status


# ── Node 3: product control classification (tool call) ─────────────────────
def make_product_node(tools):
    def classify_control_category(state: AgentState) -> dict:
        pc = tools.classify_product(state.get("product", ""), state.get("api_key") or "")
        detail = (f"{pc.get('category_name')} → {pc.get('control_level')}"
                  + (f" (CCL {pc.get('ccl_reference')})" if pc.get("ccl_reference") else ""))
        return {
            "product_classification": pc,
            "trace": [_entry("classify_control_category",
                             f"Classify product ({tools.backend_kind} tool)",
                             detail, pc)],
        }
    return classify_control_category


# ── Node 4: combine the two checks (deterministic decision matrix) ─────────
def combine_decide(state: AgentState) -> dict:
    decision = combine_and_decide(state["country_status"], state["product_classification"])
    detail = (f"country={decision['country_level']} × product={decision['product_level']} "
              f"→ {decision['outcome_label']} ({decision['driver']}-driven)")
    return {
        "decision": decision,
        "outcome": decision["outcome"],
        "outcome_label": decision["outcome_label"],
        "trace": [_entry("combine_and_decide", "Combine & decide", detail, decision)],
    }


def route_outcome(state: AgentState) -> str:
    outcome = state["decision"]["outcome"]
    if outcome == PROHIBITED:
        return "explain_prohibited"
    if outcome == NOT_REQUIRED:
        return "explain_clear"
    return "explain_required"


# ── Node 5 (×3 branches): generate the auditable explanation ───────────────
def _make_explain(step: str, title: str):
    def explain(state: AgentState) -> dict:
        text = generate_explanation(state["country_status"],
                                    state["product_classification"], state["decision"])
        return {"explanation": text, "trace": [_entry(step, title, text)]}
    return explain


def build_graph(tools):
    """Compile the LangGraph agent over the given tools backend."""
    g = StateGraph(AgentState)
    g.add_node("parse_query", make_parse_node())
    g.add_node("check_country_status", make_country_node(tools))
    g.add_node("classify_control_category", make_product_node(tools))
    g.add_node("combine_and_decide", combine_decide)
    g.add_node("explain_prohibited", _make_explain("explain", "Explain — prohibited"))
    g.add_node("explain_required", _make_explain("explain", "Explain — license required"))
    g.add_node("explain_clear", _make_explain("explain", "Explain — no license required"))

    g.set_entry_point("parse_query")
    g.add_edge("parse_query", "check_country_status")
    g.add_edge("check_country_status", "classify_control_category")
    g.add_edge("classify_control_category", "combine_and_decide")
    g.add_conditional_edges("combine_and_decide", route_outcome, {
        "explain_prohibited": "explain_prohibited",
        "explain_required": "explain_required",
        "explain_clear": "explain_clear",
    })
    for n in ("explain_prohibited", "explain_required", "explain_clear"):
        g.add_edge(n, END)
    return g.compile()


def run_query(compiled, *, query: str = "", product: str = "", country: str = "",
              api_key: str = "") -> dict:
    """Invoke the compiled graph and return a flat result dict for the API/UI."""
    setup_langsmith()  # enable LangSmith tracing if a key is present (no-op otherwise)
    final = compiled.invoke({"query": query, "product": product, "country": country,
                             "api_key": api_key})
    return {
        "query": query,
        "product": final.get("product", product),
        "country": final.get("country", country),
        "outcome": final.get("outcome"),
        "outcome_label": final.get("outcome_label"),
        "country_status": final.get("country_status"),
        "product_classification": final.get("product_classification"),
        "decision": final.get("decision"),
        "explanation": final.get("explanation"),
        "trace": final.get("trace", []),
    }


def mermaid() -> str:
    """The graph topology as Mermaid (for the README / UI)."""
    from tools import DirectTools
    return build_graph(DirectTools()).get_graph().draw_mermaid()