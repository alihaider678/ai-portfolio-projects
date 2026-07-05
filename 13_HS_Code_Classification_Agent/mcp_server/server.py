"""
TariffLens — MCP Server
=======================

A Model Context Protocol server exposing HS-code classification + duty-lookup
tools backed by hybrid RAG over the real USITC HTS schedule. Hermes Agent (or any
MCP client) discovers these tools and calls them to classify products and look up
duties in plain-English workflows.

Run standalone (stdio transport):
    python server.py

Serve over HTTP (so a Docker-based Hermes Agent can reach it):
    python server.py --http --port 8021

Tools:
  - classify_product(product, top_k)   -> best HS code + confidence + justification + duty
  - get_duty_rate(hts_code)            -> duty rate for a specific code
  - get_hs_details(hts_code)           -> full record + statistical suffixes
Resource:
  - tarifflens://stats                 -> dataset coverage
"""
from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from engine import load_engine

mcp = FastMCP("tarifflens")

_engine = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = load_engine()
    return _engine


@mcp.tool()
def classify_product(product: str, top_k: int = 5) -> dict:
    """
    Classify a plain-English product description into the best-matching US HTS
    (Harmonized Tariff Schedule) code, with the applicable duty rate.

    Use this when someone describes goods ("waterproof leather hiking boots,
    rubber sole") and needs the correct customs classification. Uses hybrid RAG
    (keyword + semantic retrieval, fused and reranked) over the official schedule.

    Args:
        product: Plain-English product description.
        top_k: How many candidate codes to return alongside the best pick.

    Returns a dict with: suggested_hts_code, hs6, description, confidence,
    justification, duty (rate info), runner_up_codes, and candidates[].
    """
    try:
        return get_engine().classify(product, top_k=top_k)
    except FileNotFoundError as e:
        return {"error": str(e), "hint": "Run ingest.py then build_index.py."}


@mcp.tool()
def get_duty_rate(hts_code: str) -> dict:
    """
    Look up the US import duty rate for a specific HTS code (e.g. "6403.51.00").
    Resolves the rate from 10-digit statistical suffixes when the given line has
    no rate of its own.
    """
    try:
        return get_engine().get_duty_rate(hts_code)
    except FileNotFoundError as e:
        return {"error": str(e)}


@mcp.tool()
def get_hs_details(hts_code: str) -> dict:
    """
    Fetch the full record for an HTS code: its description, full nomenclature
    path, chapter, duty fields, units, and any 10-digit statistical suffixes.
    """
    try:
        return get_engine().get_hs_details(hts_code)
    except FileNotFoundError as e:
        return {"error": str(e)}


@mcp.resource("tarifflens://stats")
def dataset_stats() -> str:
    """Coverage of the loaded HTS dataset."""
    try:
        s = get_engine().store.stats()
    except Exception as e:  # noqa: BLE001
        return str(e)
    return (
        f"TariffLens dataset coverage (USITC HTS):\n"
        f"- Total HTS lines: {s['total_lines']:,}\n"
        f"- Indexed for retrieval (6- & 8-digit): {s['indexed_lines']:,}\n"
        f"- Lines with a duty rate: {s['with_duty_rate']:,}\n"
        f"- Chapters: {s['chapters']}"
    )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="TariffLens MCP server")
    parser.add_argument("--http", action="store_true",
                        help="Serve over HTTP (streamable-http) so a Dockerized "
                             "Hermes Agent can reach it via host.docker.internal.")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8021)
    args = parser.parse_args()

    if args.http:
        from mcp.server.transport_security import TransportSecuritySettings

        mcp.settings.host = args.host
        mcp.settings.port = args.port
        # Trust the hosts a Dockerized client uses; without this the transport's
        # DNS-rebinding protection returns 421 for the host.docker.internal Host.
        mcp.settings.transport_security = TransportSecuritySettings(
            enable_dns_rebinding_protection=True,
            allowed_hosts=["host.docker.internal:*", "localhost:*", "127.0.0.1:*"],
            allowed_origins=[
                "http://host.docker.internal:*",
                "http://localhost:*",
                "http://127.0.0.1:*",
            ],
        )
        print(f"TariffLens MCP server (HTTP) at http://{args.host}:{args.port}/mcp")
        mcp.run(transport="streamable-http")
    else:
        mcp.run()  # stdio transport (default)