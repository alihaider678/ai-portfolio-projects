# 🛡️ LicenseGuard — Export License Determination Agent

> A **LangGraph** agent that decides whether an **export license** is required for a product-and-destination — cross-referencing **OFAC country sanctions** against **US Commerce Control List (CCL)** dual-use categories through **MCP tools**, and showing a transparent, auditable **reasoning graph** instead of a black-box verdict.

**Portfolio Project 14** · Trade-compliance / RegTech domain — export controls, sanctions screening, agentic decision-support.

> **New here?** Read **[❓ What is this?](#-what-is-this-in-plain-english)** → then **[🎥 watch the demo](#-see-it-in-action)** → then **[🌐 try the live app](#-live-demo)**.

---

## ❓ What is this? (in plain English)

**The problem.** Before a company exports something internationally — software, hardware, technology — it can't just ship it. Governments restrict exports along **two independent dimensions**:

1. **Where it's going** — some countries are under sanctions or embargoes (OFAC).
2. **What it is** — some products are "dual-use" (potential military/surveillance use) and sit on control lists (the US CCL).

**The catch:** the answer depends on the **combination**, not either dimension alone. An ordinary laptop is fine to most countries — but not to an embargoed one. Encryption software is controlled almost *everywhere*, regardless of destination. Compliance teams cross-reference these lists by hand today.

**What LicenseGuard does.** You describe **what you're shipping** and **where it's going** in plain English; the agent checks both dimensions, applies a decision matrix, and returns **License Required / Not Required / Prohibited** — with a step-by-step, auditable justification citing exactly which rule(s) triggered the outcome.

**Why an agent (LangGraph) and not a script?** Because the value in compliance is *auditable reasoning*. LangGraph runs the decision as a **graph of steps** that **branches** into three outcomes, and exposes every node — so you see *how* it decided, not just *what* it decided.

**What is MCP?** The [Model Context Protocol](https://modelcontextprotocol.io) — an open "USB port for AI tools." The country and product checks are exposed as MCP tools, so the LangGraph agent (or any MCP client) can discover and call them.

**What is LangSmith?** [LangSmith](https://smith.langchain.com) traces every agent run — each node, tool call, latency and token cost — for full observability.

---

## 🎥 See it in action

**▶️ [Watch the demo](frontend/public/demo.mp4)** (also embedded in the live web app's "See it decide" section).

The demo shows the **LangGraph agent** parsing a question, calling the **MCP tools** for both checks, branching at the decision node, and returning a verdict with its reasoning trace — plus the run appearing live in **LangSmith**.

---

## 🌐 Live demo

- **🖥️ Web app:** _(add after Vercel deploy)_
- **⚙️ Backend API:** _(add after Render deploy)_ — health at `/api/health`, docs at `/docs`

> ⚠️ The backend runs on a free tier that sleeps after ~15 min idle, so the **first** request may take ~30–50 s to wake up.

---

## 🧠 How it works — the reasoning graph

```
              parse_query
                   │
        check_country_status      ← MCP tool  (OFAC country lookup)
                   │
     classify_control_category     ← MCP tool  (US CCL classification, LLM)
                   │
           combine_and_decide      ← decision matrix
              ╱      │      ╲
   explain_clear  explain_    explain_
   (NOT_REQUIRED) required    prohibited
                (LICENSE_REQ) (PROHIBITED)
                   ╲     │     ╱
                       END
```

**The decision matrix** (destination × product):

| product ＼ destination | Unrestricted | Partial | Embargoed |
|---|---|---|---|
| **Uncontrolled** | ✅ No License | 📋 License (country) | ⛔ Prohibited |
| **Dual-use** | 📋 License (product) | 📋 License (both) | ⛔ Prohibited |
| **Controlled** | 📋 License (product) | 📋 License (both, high) | ⛔ Prohibited |

**"Two front doors", one brain.** The same rules engine is exposed two ways:

```
                 ┌──────────────────────────────────────────┐
                 │   Rules engine (rules_engine.py)           │
                 │   country lookup · CCL classification ·    │
                 │   decision matrix · explanation            │
                 └──────────────────────────────────────────┘
                      ▲                          ▲
           in-process │                          │  MCP protocol
                      │                          │
          ┌───────────┴──────────┐    ┌──────────┴───────────┐
          │  FastAPI backend      │    │  MCP server           │
          │  runs the LangGraph   │    │  (server.py :8022)    │
          │  agent (:8012)        │    │                       │
          └───────────┬──────────┘    └──────────┬───────────┘
                      │                          │
          ┌───────────┴──────────┐    ┌──────────┴───────────┐
          │  Next.js web app      │    │  LangGraph agent      │
          │  → the LIVE demo      │    │  → the MCP demo       │
          └──────────────────────┘    └──────────────────────┘
```

The web app runs the LangGraph agent with the tools **in-process** (reliable, single deployable). The `run_agent.py` demo runs the **same graph** with the tools **over MCP** — proving MCP + LangGraph together.

---

## ⚙️ Run it yourself

**Prerequisites:** Python 3.11, Node 18+, an `OPENAI_API_KEY`. LangSmith key optional.

```bash
# 0. Env + deps
python -m venv .venv
.venv\Scripts\pip install -r backend/requirements.txt
copy .env.example .env      # add OPENAI_API_KEY (and optionally LANGSMITH_API_KEY)

# 1a. Backend (runs the LangGraph agent) — the web API
.venv\Scripts\python -m uvicorn backend.main:app --port 8012

# 1b. Frontend
cd frontend && npm install && npm run dev      # http://localhost:3000
```

**The MCP + LangGraph agent demo (optional):**
```bash
# free-text question, driven over real MCP tool calls
.venv\Scripts\python agent/run_agent.py "Can I export encryption software to Iran?"
.venv\Scripts\python agent/run_agent.py --draw        # print the LangGraph topology
```

**Evaluation:**
```bash
.venv\Scripts\python eval/run_eval.py                 # outcome + driver accuracy
```

---

## 🧩 Tech stack

| Layer | Technology |
|-------|-----------|
| Agent framework | **LangGraph** (stateful graph, conditional edges) |
| Tool protocol | **MCP** (Model Context Protocol — `mcp` Python SDK / FastMCP) |
| Observability | **LangSmith** (per-node tracing, latency, token cost) |
| Product classification | **OpenAI** `gpt-4o-mini` (structured JSON), with a keyword fallback |
| Reference data | **OFAC** country sanctions + **US CCL** dual-use categories (curated public subset) |
| Backend | FastAPI (Python 3.11) |
| Frontend | Next.js + TypeScript + Tailwind (theme-aware, bring-your-own-key) |
| Deployment | Render (backend) + Vercel (frontend) |

---

## 📁 Project structure

```
14_Export_License_Determination_Agent/
├── mcp_server/          # Rules engine + MCP server
│   ├── data/            # countries.json (OFAC) + ccl_categories.json (US CCL)
│   ├── rules_engine.py  # country/product checks + decision matrix + explanation
│   └── server.py        # MCP server: check_country_status / classify_control_category / determine_license_requirement
├── agent/               # LangGraph agent
│   ├── graph.py         # parse → country → product → decide → (branch) → explain
│   ├── tools.py         # DirectTools (in-process) | MCPTools (over MCP)
│   └── run_agent.py     # CLI demo (LangGraph over MCP, LangSmith on)
├── backend/             # FastAPI — runs the agent, returns the reasoning trace
├── frontend/            # Next.js web app (problem → try → how → demo → FAQ)
└── eval/                # Labeled test set + accuracy harness
```

---

## 🗺️ Roadmap / what's next

- [ ] Deploy the web app live (Render + Vercel).
- [ ] Record the LangGraph + MCP + LangSmith demo.
- [ ] Swap the curated reference data for live OFAC / BIS feeds.
- [ ] Add EU Dual-Use Regulation as a second regime (US CCL is the current basis).

---

## ⚠️ Disclaimer

Portfolio demonstration built on a **curated, simplified subset** of public OFAC country-sanctions and US Commerce Control List data — enough to demonstrate real cross-referencing logic, **not** legal-grade completeness. Determinations are **for guidance only** — real export classifications must be confirmed with a licensed export-compliance professional or the relevant authority.