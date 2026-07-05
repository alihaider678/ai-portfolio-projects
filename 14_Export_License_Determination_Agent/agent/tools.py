"""
LicenseGuard — tool backends for the LangGraph agent
====================================================

The LangGraph graph is defined once (graph.py) and parametrised by a *tools*
object that exposes two calls:

    check_country(country)      -> country-status dict
    classify_product(product)   -> control-classification dict

Two interchangeable implementations:

  • DirectTools — calls the rules engine in-process. Fast + rock-solid; used by
    the FastAPI web backend (single deployable service).

  • MCPTools — calls the SAME logic over the Model Context Protocol (stdio),
    spawning mcp_server/server.py as a subprocess and invoking its tools. This
    is what proves "LangGraph orchestrating MCP tools" in the demo.

Both return identical dict shapes, so the graph — and the reasoning trace it
produces — is byte-for-byte the same regardless of backend.
"""
from __future__ import annotations

import asyncio
import json
import sys
import threading
from pathlib import Path

MCP_SERVER_DIR = Path(__file__).parent.parent / "mcp_server"
SERVER_SCRIPT = MCP_SERVER_DIR / "server.py"


# ── In-process backend (web app) ──────────────────────────────────────────
class DirectTools:
    backend_name = "direct (in-process rules engine)"
    backend_kind = "direct"

    def __init__(self) -> None:
        if str(MCP_SERVER_DIR) not in sys.path:
            sys.path.insert(0, str(MCP_SERVER_DIR))
        from rules_engine import load_engine
        self.engine = load_engine()

    def check_country(self, country: str) -> dict:
        return self.engine.check_country_status(country)

    def classify_product(self, product: str, api_key: str | None = None) -> dict:
        return self.engine.classify_control_category(product, api_key)

    def close(self) -> None:  # symmetry with MCPTools
        pass


# ── MCP backend (agent demo) ──────────────────────────────────────────────
class MCPTools:
    """
    Calls the tools over MCP. Runs an asyncio event loop on a background thread
    and bridges the async MCP client to the graph's synchronous nodes.
    """
    backend_name = "MCP (stdio) server: licenseguard"
    backend_kind = "mcp"

    def __init__(self, timeout: float = 60.0) -> None:
        self.timeout = timeout
        self._loop = asyncio.new_event_loop()
        self._thread = threading.Thread(target=self._loop.run_forever, daemon=True)
        self._thread.start()
        self._session = None
        self._stdio_cm = None
        self._session_cm = None
        self._run(self._connect()).result(timeout=timeout)

    def _run(self, coro):
        return asyncio.run_coroutine_threadsafe(coro, self._loop)

    async def _connect(self) -> None:
        from mcp import ClientSession, StdioServerParameters
        from mcp.client.stdio import stdio_client

        params = StdioServerParameters(
            command=sys.executable,
            args=[str(SERVER_SCRIPT)],
            cwd=str(MCP_SERVER_DIR),
        )
        self._stdio_cm = stdio_client(params)
        read, write = await self._stdio_cm.__aenter__()
        self._session_cm = ClientSession(read, write)
        self._session = await self._session_cm.__aenter__()
        await self._session.initialize()

    def list_tools(self) -> list[str]:
        async def _list():
            resp = await self._session.list_tools()
            return [t.name for t in resp.tools]
        return self._run(_list()).result(timeout=self.timeout)

    def _call(self, name: str, args: dict) -> dict:
        async def _c():
            res = await self._session.call_tool(name, args)
            # Prefer structured content; fall back to parsing the JSON text block.
            sc = getattr(res, "structuredContent", None)
            if isinstance(sc, dict):
                return sc.get("result", sc) if set(sc.keys()) == {"result"} else sc
            for block in res.content:
                text = getattr(block, "text", None)
                if text:
                    return json.loads(text)
            return {}
        return self._run(_c()).result(timeout=self.timeout)

    def check_country(self, country: str) -> dict:
        return self._call("check_country_status", {"country": country})

    def classify_product(self, product: str, api_key: str | None = None) -> dict:
        # The MCP server uses its own server-side key; per-request keys are a
        # web-app (DirectTools) concern, so api_key is intentionally ignored here.
        return self._call("classify_control_category", {"product_description": product})

    def close(self) -> None:
        async def _close():
            try:
                if self._session_cm:
                    await self._session_cm.__aexit__(None, None, None)
            finally:
                if self._stdio_cm:
                    await self._stdio_cm.__aexit__(None, None, None)
        try:
            self._run(_close()).result(timeout=self.timeout)
        except Exception:  # noqa: BLE001
            pass
        self._loop.call_soon_threadsafe(self._loop.stop)


def make_tools(kind: str = "direct"):
    """Factory: 'direct' (in-process) or 'mcp' (over the MCP protocol)."""
    return MCPTools() if kind == "mcp" else DirectTools()