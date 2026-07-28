# 💬 WalletAssist — Bill Payment & Wallet Support Agent

> A **LangGraph** agent that answers digital-wallet support questions the way a good human agent would — deciding whether a question needs real product knowledge, an account-specific lookup, or a human, instead of running one fixed script for every message.

**Portfolio Project 16** · Fintech / customer-support domain — RAG + tool-calling, agentic routing, honest escalation.

> **New here?** Read **[❓ What is this?](#-what-is-this-in-plain-english)** → then **[🧠 how it works](#-how-it-works--the-routing-graph)** → then **[🌐 try the live app](#-live-demo)**.

---

## ❓ What is this? (in plain English)

**The business problem.** Digital wallets like Keenu handle a huge volume of repetitive support questions — "how do I split a bill," "why did my payment fail," "how do top-ups work," "where's my transfer." Most of these don't need a human: they need either accurate product knowledge or a quick check of the user's own transaction data. Routing every question to a live agent doesn't scale; a chatbot that hallucinates product details or pretends to resolve a fraud report isn't safe either.

**The solution WalletAssist demonstrates.** An agent that reads each message and picks the right path:

1. **General product question** ("how do I split a bill") → retrieved from real, hybrid-searched FAQ content — never made up.
2. **Account-specific question** ("why did my last payment fail") → a real lookup against the user's transaction data, with the actual failure reason.
3. **Genuinely ambiguous** (no transaction ID, no account selected) → it asks a follow-up instead of guessing.
4. **Something it shouldn't try to fix** (a disputed charge, a fraud report) → flagged honestly for a human, not "resolved" by a bot.

**Why this is genuinely agentic, not just "call an LLM."** A single fixed prompt that always retrieves FAQ content and hopes for the best breaks the moment someone asks about their own transaction. Here, a classification step reads the message and its context (is there a transaction ID? is an account selected?) and **decides which of four paths applies**, per message — closer to how a real support agent triages a queue.

**Real product knowledge, not synthetic FAQ.** The 38 general-question answers are the **actual, real, publicly published** FAQ content from Keenu's own help page (keenu.pk/faqs) — used here strictly to demonstrate genuine RAG grounding. All account and transaction data is entirely synthetic; no real Keenu customer data exists anywhere in this project. WalletAssist is an independent, unofficial demo — not built, endorsed, or affiliated with Keenu / Wemsol Pvt Ltd.

---

## 🌐 Live demo

- **🖥️ Web app:** *(added after deployment)*
- **⚙️ Backend API:** *(added after deployment)* — docs at `/docs`

> ⚠️ The backend runs on a free tier that sleeps after ~15 min idle, so the **first** request may take ~30–50 s to wake up. After that it's fast.

---

## 🧠 How it works — the routing graph

```
                         ┌──────────────────┐
                         │  classify_intent   │  ← LLM: faq | account_specific | escalation
                         │  (+ extract txn id) │
                         └─────────┬─────────┘
              ┌───────────────────┼───────────────────┐
              │ faq                │ account_specific    │ escalation
              ▼                    ▼                     ▼
   ┌─────────────────────┐  ambiguous?           ┌─────────────────┐
   │  retrieve_knowledge   │  ┌────┴────┐          │ escalation_check  │  ← human handoff,
   │  hybrid BM25+semantic │  │yes    no│          │ never pretends    │    not "resolved"
   └──────────┬──────────┘  ▼         ▼           └────────┬────────┘
              │      ┌──────────────┐ ┌───────────────────┐│
              │      │needs_        │ │lookup_transaction   ││
              │      │clarification │ │ (real status/reason) ││
              │      └──────┬───────┘ └──────────┬─────────┘│
              │             │                    │           │
              └─────────────┼────────────────────┘           │
                             ▼                                │
                   ┌──────────────────┐                       │
                   │  compose_response   │                     │
                   │  (natural synthesis, │                     │
                   │   never raw dump)    │                     │
                   └──────────┬───────┘                        │
                              ▼                                 ▼
                             END ◄─────────────────────────────┘
```

**The routing is the point.** `classify_intent` runs once per message and decides the path — it isn't a fixed pipeline with an LLM narrating whatever comes out at the end. `needs_clarification` only fires when the question is genuinely unresolvable (no transaction ID *and* no account context); otherwise the tool path resolves it directly, including the common case of "my last payment" when an account is already selected.

**Architecture:**

```
                    ┌──────────────────────────────────────┐
                    │   FastAPI backend (async)               │
                    │   /api/chat runs the LangGraph flow      │
                    └───────┬──────────────────────┬────────┘
                            │                       │
              ┌─────────────▼──────────┐  ┌────────▼─────────────┐
              │  SQLite                  │  │  Chroma + BM25         │
              │  accounts · transactions   │  │  hybrid FAQ retrieval   │
              │  sessions · conversation log│  │  (precomputed embeddings)│
              └────────────────────────┘  └───────────────────────┘
                            ▲
                            │
                    ┌───────┴────────────┐
                    │  Next.js frontend    │
                    │  phone-mockup chat UI │
                    └────────────────────┘
```

**BYOK (bring your own key).** Every OpenAI call for a real chat message uses either the visitor's own API key (pasted client-side, sent per-request, never logged or persisted server-side) or a tightly rate-limited shared demo key — never a personal always-on key sitting in the backend's `.env`. The one exception is the FAQ knowledge-base embeddings themselves: those are a one-time build step over a small, static, 38-entry corpus (`agent/build_index.py`, owner key, committed to the repo) — not a per-visitor cost, so it doesn't conflict with the BYOK policy.

**Structured logging.** Every conversation turn logs which intent was classified and which path was taken (`backend/db.py`'s `conversation_log` table) — the same transparency the frontend surfaces live via the 📚/🔍/🙋/❓ badge on each response.

---

## ⚙️ Run it yourself

**Prerequisites:** Python 3.11+, Node 18+, an OpenAI API key.

```bash
# 0. Backend deps (installs the agent's deps too — self-sufficient)
pip install -r backend/requirements.txt

# 1. Build the FAQ knowledge base embeddings (one-time; needs OPENAI_API_KEY)
export OPENAI_API_KEY=sk-...
python agent/build_index.py

# 2. Generate the synthetic mock transaction dataset
python data/generate_mock_transactions.py

# 3. Backend (SQLite auto-initializes + seeds on first run)
cd backend && uvicorn main:app --port 8010 --reload

# 4. Frontend
cd frontend && npm install && npm run dev      # http://localhost:3000
```

---

## 🧩 Tech stack

| Layer | Technology |
|-------|-----------|
| Agent framework | **LangGraph** — conditional routing (faq / tool / clarify / escalate) |
| LLM | **OpenAI GPT-4o** (classify · compose · escalation) + `text-embedding-3-small` |
| RAG | **Chroma + BM25**, fused via Reciprocal Rank Fusion — real Keenu FAQ content |
| Backend | **FastAPI**, `aiosqlite`, session management, structured per-turn logging |
| Frontend | **Next.js**, TypeScript, Tailwind, `framer-motion`, phone-mockup chat UI, dark/light theme toggle |
| Data | Real Keenu public FAQ content (38 Q&A) + entirely synthetic mock transaction data |
| Deployment | Render (backend) + Vercel (frontend) |

---

## 📁 Project structure

```
16_WalletAssist_Bill_Payment_Support_Agent/
├── agent/                 # LangGraph agent
│   ├── graph.py             # classify → route → (RAG | tool | clarify | escalate) → compose
│   ├── knowledge_base.py     # hybrid BM25 + Chroma dense retrieval, RRF fusion
│   ├── build_index.py        # one-time FAQ embedding build (owner key)
│   ├── index/                 # committed: faq_records.jsonl + embeddings.npy
│   └── requirements.txt
├── backend/                # FastAPI — REST wrapper around the agent
│   ├── main.py               # routes: chat, transactions/status, accounts, ingest, health
│   ├── db.py                  # SQLite: accounts/transactions, sessions, conversation log
│   └── schemas.py               # Pydantic request/response models
├── data/                    # real FAQ source + synthetic transaction generator
│   ├── keenu_faqs.json         # real, public FAQ content (with provenance note)
│   └── generate_mock_transactions.py
└── frontend/                 # Next.js web app (phone-mockup chat UI)
```

---

## 🗺️ Roadmap / what's next

- [x] Backend built, tested end-to-end locally across all four routing paths.
- [x] Frontend built: phone-mockup chat UI, source-indicator badges, dark/light theme.
- [ ] Deploy backend (Render) + frontend (Vercel).
- [ ] Record a short demo video of a conversation covering all four paths.

---

## ⚠️ Disclaimer

WalletAssist is an independent, unofficial portfolio demonstration — **not** built, endorsed, sponsored, or affiliated with Keenu / Wemsol Pvt Ltd in any way. The 38 FAQ answers used for grounding are real, publicly published content from Keenu's own help page, used solely to demonstrate genuine RAG retrieval instead of hallucinated answers. All account names and transaction data are entirely synthetic and fictional — no real Keenu customer data exists anywhere in this project. This is not a production support system.