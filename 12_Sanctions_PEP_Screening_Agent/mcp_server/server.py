"""
AegisScreen — MCP Screening Server
==================================

A Model Context Protocol server exposing sanctions/PEP screening tools over
real OFAC + OpenSanctions data. Hermes Agent (or any MCP client) discovers
these tools automatically and calls them to screen entities.

Run standalone (stdio transport):
    python server.py

Register with Hermes Agent (~/.hermes/config.yaml):
    mcp_servers:
      aegisscreen:
        command: python
        args: ["/abs/path/to/mcp_server/server.py"]

Tools:
  - screen_entity(name, entity_type, limit)
  - batch_screen(names, entity_type)
  - get_entity_details(entity_id)
Resource:
  - screening://stats   (dataset coverage)
"""
from __future__ import annotations

from mcp.server.fastmcp import FastMCP

import matcher
from datastore import load_store

mcp = FastMCP("aegisscreen")

# Lazily loaded so the server can start (and list its tools) even before the
# dataset is ingested; the first tool call surfaces a clear error if missing.
_store = None


def get_store():
    global _store
    if _store is None:
        _store = load_store()
    return _store


@mcp.tool()
def screen_entity(name: str, entity_type: str = "any", limit: int = 5) -> dict:
    """
    Screen a single company or individual against sanctions and PEP lists.

    Use this to check whether a party (customer, supplier, shipment party,
    beneficial owner) appears on the OFAC sanctions list or is a Politically
    Exposed Person. Handles spelling variants, aliases, and transliterations
    via fuzzy + phonetic matching.

    Args:
        name: The entity name to screen (person or organization).
        entity_type: "any" (default), "person", or "organization".
        limit: Max number of matches to return (default 5).

    Returns a dict with:
        overall_risk: LOW | MEDIUM | HIGH | CRITICAL
        match_count: number of matches found
        matches: list of {matched_name, primary_name, list_type, source,
                          score, risk_level, confidence, programs, countries,
                          explanation}
    """
    try:
        return matcher.screen(get_store(), name, entity_type=entity_type, limit=limit)
    except FileNotFoundError as e:
        return {"error": str(e), "hint": "Run `python ingest.py` to load the datasets."}


@mcp.tool()
def batch_screen(names: list[str], entity_type: str = "any") -> dict:
    """
    Screen multiple names at once (e.g. all parties on a shipment or an
    entire customer list). Returns per-name results plus a summary of how
    many names hit each risk level — useful for prioritising review.

    Args:
        names: List of entity names to screen.
        entity_type: "any" (default), "person", or "organization".
    """
    try:
        store = get_store()
    except FileNotFoundError as e:
        return {"error": str(e), "hint": "Run `python ingest.py` to load the datasets."}

    results = [matcher.screen(store, n, entity_type=entity_type, limit=3) for n in names]
    summary: dict[str, int] = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for r in results:
        summary[r["overall_risk"]] += 1
    return {
        "screened": len(names),
        "risk_summary": summary,
        "flagged": [r for r in results if r["overall_risk"] != "LOW"],
        "results": results,
    }


@mcp.tool()
def get_entity_details(entity_id: str) -> dict:
    """
    Fetch the full record for a matched entity by its ID (as returned in a
    screening match). Use this to review the complete profile — all aliases,
    associated countries, and sanctions programs — before making a decision.
    """
    try:
        rec = get_store().get_by_id(entity_id)
    except FileNotFoundError as e:
        return {"error": str(e)}
    if not rec:
        return {"error": f"No entity found with id '{entity_id}'."}
    return rec


@mcp.resource("screening://stats")
def dataset_stats() -> str:
    """Coverage of the loaded screening datasets (entity counts by list)."""
    try:
        s = get_store().stats()
    except FileNotFoundError as e:
        return str(e)
    return (
        f"AegisScreen dataset coverage:\n"
        f"- Total entities: {s['total_entities']:,}\n"
        f"- Sanctions (OFAC): {s['sanctions_entities']:,}\n"
        f"- PEP: {s['pep_entities']:,}\n"
        f"- Indexed names + aliases: {s['indexed_names']:,}"
    )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="AegisScreen MCP server")
    parser.add_argument("--http", action="store_true",
                        help="Serve over HTTP (streamable-http) instead of stdio — "
                             "used so a Hermes Agent running in Docker can reach it "
                             "via http://host.docker.internal:<port>/mcp")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8020)
    args = parser.parse_args()

    if args.http:
        from mcp.server.transport_security import TransportSecuritySettings

        mcp.settings.host = args.host
        mcp.settings.port = args.port
        # DNS-rebinding protection stays ON, but we explicitly trust the hosts a
        # Docker-based client (Hermes Agent) uses to reach us: host.docker.internal
        # is how a container addresses the host on Docker Desktop. Without this the
        # transport returns 421 Misdirected Request for that Host header.
        mcp.settings.transport_security = TransportSecuritySettings(
            enable_dns_rebinding_protection=True,
            allowed_hosts=["host.docker.internal:*", "localhost:*", "127.0.0.1:*"],
            allowed_origins=[
                "http://host.docker.internal:*",
                "http://localhost:*",
                "http://127.0.0.1:*",
            ],
        )
        print(f"AegisScreen MCP server (HTTP) at http://{args.host}:{args.port}/mcp")
        mcp.run(transport="streamable-http")
    else:
        mcp.run()  # stdio transport (default) — for local MCP clients