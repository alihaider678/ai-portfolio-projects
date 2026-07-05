"""
LicenseGuard — LangGraph agent runner (demo CLI)
================================================

Runs the LangGraph agent over the MCP tools (default) or the in-process engine,
printing the step-by-step reasoning trace. This is the script recorded for the
demo: it proves LangGraph orchestrating MCP tools, with LangSmith tracing on.

Examples:
    # free-text question, over MCP (spawns mcp_server/server.py via stdio)
    python run_agent.py "Can I export encryption software to France?"

    # explicit product + destination
    python run_agent.py --product "datacenter AI training GPU" --country China

    # use the in-process engine instead of MCP
    python run_agent.py --backend direct "Export laptops to Iran?"

    # print the LangGraph topology (Mermaid) and exit
    python run_agent.py --draw
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent.parent / "mcp_server"))

# Windows consoles default to cp1252 and choke on the box-drawing / emoji output.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:  # noqa: BLE001
    pass

from config import setup_langsmith  # noqa: E402
from graph import build_graph, mermaid, run_query  # noqa: E402
from tools import make_tools  # noqa: E402

OUTCOME_ICON = {"NOT_REQUIRED": "✅", "LICENSE_REQUIRED": "📋", "PROHIBITED": "⛔"}


def _print_result(res: dict) -> None:
    print("\n" + "═" * 68)
    print(f"  Product     : {res['product']}")
    print(f"  Destination : {res['country']}")
    print("─" * 68)
    print("  Reasoning trace:")
    for i, t in enumerate(res["trace"], 1):
        print(f"   {i}. [{t['step']}] {t['title']}")
        if t.get("detail"):
            print(f"        → {t['detail']}")
    print("─" * 68)
    icon = OUTCOME_ICON.get(res["outcome"], "•")
    print(f"  {icon}  DECISION: {res['outcome_label']}  "
          f"(scrutiny: {res['decision']['scrutiny']})")
    print(f"\n  {res['explanation']}")
    if res["decision"]["triggers"]:
        print("\n  Triggers:")
        for tr in res["decision"]["triggers"]:
            print(f"   • [{tr['type']}] {tr['detail']}")
    print("═" * 68 + "\n")


def main() -> None:
    ap = argparse.ArgumentParser(description="LicenseGuard LangGraph agent")
    ap.add_argument("query", nargs="?", default="", help="Free-text export question")
    ap.add_argument("--product", default="", help="Product description (skips parsing)")
    ap.add_argument("--country", default="", help="Destination country (skips parsing)")
    ap.add_argument("--backend", choices=["mcp", "direct"], default="mcp",
                    help="Tool backend: 'mcp' (default, over MCP) or 'direct'.")
    ap.add_argument("--draw", action="store_true", help="Print the LangGraph Mermaid and exit")
    args = ap.parse_args()

    if args.draw:
        print(mermaid())
        return

    if not (args.query or (args.product and args.country)):
        ap.error("provide a free-text query, or both --product and --country")

    traced = setup_langsmith()
    print(f"LangSmith tracing: {'ON (project=licenseguard)' if traced else 'off (no key)'}")

    tools = make_tools(args.backend)
    print(f"Tool backend: {tools.backend_name}")
    if args.backend == "mcp":
        print(f"MCP tools discovered: {tools.list_tools()}")
    try:
        compiled = build_graph(tools)
        res = run_query(compiled, query=args.query,
                        product=args.product, country=args.country)
        _print_result(res)
    finally:
        tools.close()


if __name__ == "__main__":
    main()