"""
LicenseGuard — MCP Server
=========================

A Model Context Protocol server exposing the export-license decision tools
backed by the shared rules engine. The LangGraph agent (or any MCP client)
discovers these tools and calls them to reason about a product-destination pair.

Run standalone (stdio transport — how the LangGraph agent spawns it):
    python server.py

Serve over HTTP (so a remote / Dockerized MCP client can reach it):
    python server.py --http --port 8022

Tools:
  - check_country_status(country)                      -> restriction level + program
  - classify_control_category(product_description)     -> control level + CCL category
  - determine_license_requirement(country, product)    -> full combined decision
Resource:
  - licenseguard://stats                               -> reference-data coverage
"""
from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from rules_engine import load_engine

mcp = FastMCP("licenseguard")


@mcp.tool()
def check_country_status(country: str) -> dict:
    """
    Check whether a destination COUNTRY is restricted for US export purposes.

    Returns the restriction level — "unrestricted", "partial" (targeted /
    sectoral sanctions), or "embargoed" (comprehensive embargo) — along with the
    OFAC sanctions program that applies (if any) and an explanatory note.

    Use this for the destination half of an export-license question.
    """
    return load_engine().check_country_status(country)


@mcp.tool()
def classify_control_category(product_description: str) -> dict:
    """
    Classify a plain-English PRODUCT description against the US Commerce Control
    List (CCL).

    Returns the control level — "uncontrolled" (EAR99-style), "dual-use", or
    "controlled" — plus the matched CCL category, its reference (e.g. "5D002"),
    and the reason for control.

    Use this for the product half of an export-license question.
    """
    return load_engine().classify_control_category(product_description)


@mcp.tool()
def determine_license_requirement(country: str, product_description: str) -> dict:
    """
    Determine whether an export license is required for a PRODUCT + DESTINATION
    combination — the full answer in one call.

    Combines the country check and the product-control check and returns the
    outcome ("NOT_REQUIRED", "LICENSE_REQUIRED", or "PROHIBITED"), which rule(s)
    triggered it, and a plain-English explanation. Use this when you already have
    both the product and the destination and want the final determination.
    """
    return load_engine().determine_license_requirement(country, product_description)


@mcp.resource("licenseguard://stats")
def reference_stats() -> str:
    """Coverage of the loaded reference data (countries + control categories)."""
    s = load_engine().stats()
    return (
        "LicenseGuard reference data:\n"
        f"- Countries tracked: {s['countries_tracked']} "
        f"({s['embargoed']} embargoed, {s['partial']} partial)\n"
        f"- Control categories (US CCL subset): {s['control_categories']} "
        f"({s['controlled']} controlled, {s['dual_use']} dual-use)"
    )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="LicenseGuard MCP server")
    parser.add_argument("--http", action="store_true",
                        help="Serve over HTTP (streamable-http) instead of stdio.")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8022)
    args = parser.parse_args()

    if args.http:
        from mcp.server.transport_security import TransportSecuritySettings

        mcp.settings.host = args.host
        mcp.settings.port = args.port
        # Trust the hosts a Dockerized / remote client uses; without this the
        # transport's DNS-rebinding protection returns 421 for those Host headers.
        mcp.settings.transport_security = TransportSecuritySettings(
            enable_dns_rebinding_protection=True,
            allowed_hosts=["host.docker.internal:*", "localhost:*", "127.0.0.1:*"],
            allowed_origins=[
                "http://host.docker.internal:*",
                "http://localhost:*",
                "http://127.0.0.1:*",
            ],
        )
        print(f"LicenseGuard MCP server (HTTP) at http://{args.host}:{args.port}/mcp")
        mcp.run(transport="streamable-http")
    else:
        mcp.run()  # stdio transport (default) — the LangGraph agent spawns this