# Enterprise Customer Support Agent

A production-grade AI customer support system built with **LangGraph agentic workflows**, **RAG-based knowledge retrieval**, **real-time sentiment analysis**, and **automatic human escalation** — powered by GPT-4o with streaming responses.

> **Portfolio Project 05** · Built by [Ali Haider](https://www.linkedin.com/in/ali-haider-ai-engineer/) — AI Engineer

---

## Live Demo

The frontend is a standalone Next.js 16 application. Visitors supply their own OpenAI API key (BYOK — never stored server-side), upload a knowledge base document, and chat with the agent in real time.

**Try it locally by following the setup steps below.**

---

## Architecture Overview

```
User Message
     │
     ▼
FastAPI /chat/stream  ──►  LangGraph StateGraph
                                │
                    ┌───────────┴────────────┐
                    ▼                        ▼
            Sentiment Node            (same node)
          GPT-4o classifies:
          positive / neutral /
          negative / frustrated
                    │
          ┌─────────┴──────────┐
          │ Redis counter++    │
          ▼                    ▼
    [ ≥ threshold? ]      [ below threshold ]
          │                    │
          ▼                    ▼
   Escalation Node        RAG Response Node
   - unique case ID       - ChromaDB retrieval
   - Celery task fired    - top-4 chunks injected
   - SSE stream           - GPT-4o generates answer
                          - SSE token stream
```

**Data flow for each message:**
1. Frontend sends `POST /chat/stream` with `session_id`, `message`, and `api_key`
2. FastAPI triggers `stream_agent_response()` async generator
3. LangGraph runs: Sentiment → conditional edge → Respond or Escalate
4. Tokens stream back as Server-Sent Events (`text/event-stream`)
5. Frontend `ReadableStream` parses SSE chunks and updates the UI word-by-word

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **LLM** | GPT-4o (OpenAI) | Sentiment classification + response generation |
| **Embeddings** | text-embedding-3-small | Knowledge base vectorization |
| **Agent Framework** | LangGraph 0.2+ | Stateful multi-node workflow with conditional routing |
| **RAG** | LangChain + ChromaDB | Document retrieval (top-4 chunks per query) |
| **API** | FastAPI 0.115+ | Async REST API + SSE streaming endpoint |
| **Session Memory** | Redis (redis-py) | Persistent conversation history, 24h TTL |
| **Background Jobs** | Celery 5.3+ | Async KB ingestion + escalation notifications |
| **Streaming** | Server-Sent Events | Real-time token-by-token response delivery |
| **Frontend** | Next.js 16 + React 19 | Portfolio demo UI |
| **UI** | Tailwind CSS v4 + shadcn base-nova | Component library |
| **Animations** | Framer Motion v12 | Smooth transitions and streaming effects |
| **State** | TanStack Query v5 | Server state management |

---

## Project Structure

```
05_Customer_Support_Agent/
├── backend/
│   ├── agents/
│   │   ├── nodes.py              # LangGraph node functions (sentiment, respond, escalate)
│   │   ├── support_agent.py      # LangGraph StateGraph definition
│   │   └── streaming_agent.py    # Async SSE generator wrapping the agent
│   ├── chains/
│   │   └── rag_chain.py          # RAG chain: retriever + prompt + LLM + parser
│   ├── memory/
│   │   └── conversation_memory.py # Redis-backed session memory (get/add/clear)
│   ├── tasks/
│   │   ├── kb_tasks.py           # Celery task: async KB ingestion into ChromaDB
│   │   └── escalation_tasks.py   # Celery task: escalation notification handler
│   ├── tools/
│   │   └── sentiment.py          # GPT-4o sentiment classifier tool
│   ├── utils/
│   │   └── config.py             # Pydantic Settings (reads .env, override=True)
│   ├── vectorstore/
│   │   └── chroma_store.py       # ChromaDB init, ingest, retriever
│   ├── data/
│   │   └── chroma_db/            # Persisted vector store (git-ignored)
│   ├── celery_app.py             # Celery app config (Redis broker + backend)
│   ├── main.py                   # FastAPI app: routes for chat, session, KB upload
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Main page (assembles all sections)
│   │   │   ├── layout.tsx        # Root layout: fonts, theme, query client
│   │   │   └── globals.css       # Tailwind v4 theme variables (dark + light mode)
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx    # Sticky glass header + dark/light toggle
│   │   │   │   └── Footer.tsx    # LinkedIn-branded footer
│   │   │   ├── sections/
│   │   │   │   ├── HeroSection.tsx      # Hero with animated gradient
│   │   │   │   ├── FeaturesSection.tsx  # 6-card architecture overview
│   │   │   │   ├── FAQSection.tsx       # Accordion FAQ (privacy + tech questions)
│   │   │   │   └── DemoSection.tsx      # KB upload + chat demo side-by-side
│   │   │   ├── demo/
│   │   │   │   ├── ChatDemo.tsx         # Full chat orchestrator with SSE state
│   │   │   │   ├── ApiKeyInput.tsx      # BYOK key input with show/hide
│   │   │   │   ├── KnowledgeBaseUpload.tsx # Drag & drop PDF/TXT uploader
│   │   │   │   ├── MessageBubble.tsx    # Chat bubble with sentiment badge
│   │   │   │   └── TypingIndicator.tsx  # Animated thinking dots
│   │   │   └── ThemeProvider.tsx        # Dark/light mode context + localStorage
│   │   └── lib/
│   │       ├── api.ts            # All API calls: session, chat stream, KB upload
│   │       └── types.ts          # TypeScript types: Message, StreamEvent, etc.
│   ├── .env.local                # NEXT_PUBLIC_API_URL (git-ignored)
│   └── package.json
│
├── .gitignore
├── .env.example                  # Safe template — copy to backend/.env
└── README.md
```

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Python | 3.10+ | Backend runtime |
| Node.js | 18+ | Frontend runtime |
| Docker | Any | For running Redis |
| OpenAI API Key | — | Each user supplies their own (BYOK) |

---

## Local Setup

### 1 — Clone & configure environment

```bash
git clone https://github.com/alihaider678/ai-portfolio-projects.git
cd ai-portfolio-projects/01_Projects/05_Customer_Support_Agent

# Copy the env template and add your OpenAI key
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-4o
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
CHROMA_PERSIST_DIR=./data/chroma_db
ESCALATION_THRESHOLD=2
REDIS_URL=redis://localhost:6379/0
```

### 2 — Start Redis (Docker)

```bash
docker run -d --name redis-support -p 6379:6379 redis:alpine
```

Verify it's running:

```bash
docker ps | grep redis
```

### 3 — Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4 — Start FastAPI server

```bash
# From the backend/ directory
uvicorn main:app --reload --port 8000
```

API docs are available at: `http://localhost:8000/docs`

### 5 — Start Celery worker (separate terminal)

```bash
# From the backend/ directory
# Windows requires --pool=solo
celery -A celery_app worker --loglevel=info --pool=solo

# Linux / macOS
celery -A celery_app worker --loglevel=info
```

> **Note:** Celery is optional for local testing. If the Celery worker is not running, the `/knowledge-base/upload` endpoint automatically falls back to synchronous ingestion.

### 6 — Install & start the frontend

```bash
cd frontend
npm install

# Create local env file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## Services Summary

| Service | Port | Purpose |
|---|---|---|
| FastAPI | `8000` | REST API + SSE streaming endpoint |
| Redis | `6379` | Session memory store + Celery broker/backend |
| Celery | — | Async KB ingestion + escalation notifications |
| Next.js | `3000` | Portfolio demo frontend |
| ChromaDB | — | Embedded vector store (file-based, no separate port) |

---

## API Reference

### Health check

```http
GET /health
```

### Session management

```http
POST   /session/new          → { session_id: "uuid" }
DELETE /session/{session_id} → { message: "Session cleared" }
```

### Chat (streaming SSE)

```http
POST /chat/stream
Content-Type: application/json

{
  "session_id": "uuid",
  "message": "What is your refund policy?",
  "api_key": "sk-proj-..."   // optional — falls back to server key
}
```

**SSE event stream format:**

```
data: {"type": "token", "token": "The "}
data: {"type": "token", "token": "refund "}
data: {"type": "done", "escalated": false, "case_id": null, "sentiment": "neutral"}
data: [DONE]
```

**Escalation event:**

```
data: {"type": "done", "escalated": true, "case_id": "A1B2C3D4", "sentiment": "frustrated"}
```

### Knowledge base upload

```http
POST /knowledge-base/upload
Content-Type: multipart/form-data

file: <PDF or TXT file>
```

**Response (async via Celery):**
```json
{
  "message": "Ingestion queued — 24 chunks from policy.pdf",
  "task_id": "celery-task-uuid",
  "async": true
}
```

### Task status

```http
GET /tasks/{task_id}
→ { "status": "SUCCESS", "result": { "chunks_processed": 24 } }
```

---

## Key Design Decisions

### BYOK (Bring Your Own Key)
The `api_key` field is optional on all chat endpoints. When provided, it is threaded through the entire LangGraph workflow — sentiment LLM, RAG embeddings, and response LLM all use the user-supplied key. This means portfolio visitors can demo the full system without the project author paying for API calls, and no keys are stored server-side.

### LangGraph over a simple chain
LangGraph models the workflow as a directed graph with conditional edges. Sentiment determines the execution path: a score below the escalation threshold routes to the RAG response node; at or above, it routes to the escalation node. This makes the logic explicit and easy to extend — adding new nodes (ticket creation, billing lookup) requires adding a node and an edge, not rewriting the chain.

### Redis for session memory
In-memory dicts don't survive server restarts and can't be shared across replicas. Redis stores `chat_history` (JSON-serialized message list, capped at 20) and `negative_count` (integer) per session, both with a 24-hour TTL. Sessions survive server restarts automatically.

### SSE over WebSockets
Server-Sent Events are simpler than WebSockets for one-directional streaming (server → client). FastAPI's `StreamingResponse` with `text/event-stream` requires no additional libraries and works through standard HTTP — easier to deploy behind reverse proxies and CDNs.

### Celery for KB ingestion
Document ingestion (load → split → embed → store) is CPU and network-bound and can take several seconds for large PDFs. Running it synchronously would block the HTTP thread. Celery dispatches it to a background worker, returning a `task_id` immediately so the API stays non-blocking. The endpoint falls back to synchronous ingestion if no Celery worker is available.

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | Server-side OpenAI key (used when no `api_key` in request) |
| `OPENAI_MODEL` | `gpt-4o` | LLM model for sentiment + response generation |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | Embedding model for ChromaDB |
| `CHROMA_PERSIST_DIR` | `./data/chroma_db` | Path for ChromaDB persistence |
| `ESCALATION_THRESHOLD` | `2` | Consecutive negative messages before escalation |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection string |

---

## Author

**Ali Haider** — AI Engineer  
[LinkedIn](https://www.linkedin.com/in/ali-haider-ai-engineer/) · [GitHub](https://github.com/alihaider678)

> Part of an 11-project AI portfolio targeting enterprise AI engineering roles.