# AI Medical Triage Chatbot

> An agentic multi-turn symptom interview system powered by LangGraph, RAG, and a dual-model OpenAI pipeline — delivers structured Emergency / Urgent / Routine triage assessments.

**Domain:** Healthcare AI · Clinical Decision Support  
**Stack:** LangGraph · FastAPI · ChromaDB · Redis · Next.js 16 · React 19  
**Status:** Complete — ready for deployment

---

## What It Does

Most AI chatbots answer one question and stop. This system conducts a **structured clinical interview** — asking targeted follow-up questions about duration, severity, and associated symptoms — before retrieving relevant medical knowledge and producing a colour-coded triage verdict with probable conditions and recommendations.

```
User describes symptom
        │
        ▼
┌─────────────────────────────┐
│  LangGraph Interview Agent  │  ← gpt-4o-mini (fast, cheap)
│  Asks follow-up questions   │
│  Extracts structured data   │
└───────────┬─────────────────┘
            │  completeness check (pure logic, no LLM tokens wasted)
            │  main_symptom + duration + severity + associated  OR  8 turns
            ▼
┌─────────────────────────────┐
│  ChromaDB RAG Retrieval     │  ← local sentence-transformers embeddings
│  21 medical documents       │
│  semantic top-4 search      │
└───────────┬─────────────────┘
            ▼
┌─────────────────────────────┐
│  Analysis Agent             │  ← gpt-4o (accurate, structured output)
│  Triage level + conditions  │
│  + numbered recommendations │
└─────────────────────────────┘
```

---

## Key Design Decisions

| Decision | Why |
|----------|-----|
| **Dual-model pipeline** | gpt-4o-mini handles 90% of work (interview); gpt-4o fires once for final analysis — cost-optimised without sacrificing accuracy |
| **Pure-logic completeness check** | No LLM call to decide "is there enough info?" — saves tokens on every turn |
| **Local embeddings (sentence-transformers)** | Zero embedding API cost; model downloaded once (~79 MB), runs locally |
| **In-memory ChromaDB** | No persistence needed — 21 curated documents re-seeded on startup via FastAPI lifespan hook |
| **Conservative fallback** | If analysis LLM errors → escalates to "urgent", never downgrades. Safety-first. |
| **BYOK (Bring Your Own Key)** | User provides OpenAI key in the UI — never stored server-side |
| **Redis session persistence** | Full conversation state survives page refresh; Upstash TLS cloud Redis |

---

## Project Structure

```
01_Medical_Triage_Chatbot/
├── backend/                    # FastAPI + LangGraph
│   ├── agents/
│   │   └── triage_graph.py     # LangGraph StateGraph definition
│   ├── nodes/
│   │   ├── interview.py        # Multi-turn interview node (gpt-4o-mini)
│   │   ├── completeness.py     # Pure-logic completeness gate
│   │   ├── retrieval.py        # ChromaDB RAG retrieval node
│   │   └── analysis.py        # Final triage analysis node (gpt-4o)
│   ├── data/
│   │   └── seed_medical_kb.py  # 21 medical documents, ChromaDB singleton
│   ├── memory/
│   │   └── session_store.py    # Redis load/save/delete helpers
│   ├── models/
│   │   └── schemas.py          # TriageState TypedDict + Pydantic models
│   ├── config.py               # Pydantic Settings (env vars)
│   ├── main.py                 # FastAPI app, lifespan, endpoints
│   ├── requirements.txt
│   ├── Procfile                # Render deployment
│   └── runtime.txt
│
└── frontend/                   # Next.js 16 + React 19
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx        # Landing page (all sections)
    │   │   ├── layout.tsx      # Root layout, fonts, providers
    │   │   └── globals.css     # Medical teal theme, ECG animation
    │   ├── components/
    │   │   ├── demo/
    │   │   │   ├── ChatDemo.tsx          # Full chat interface
    │   │   │   ├── TriageResultCard.tsx  # Colour-coded result card
    │   │   │   ├── MessageBubble.tsx
    │   │   │   ├── TypingIndicator.tsx
    │   │   │   └── ApiKeyInput.tsx
    │   │   ├── sections/
    │   │   │   ├── HeroSection.tsx
    │   │   │   ├── HowItWorksSection.tsx
    │   │   │   ├── FeaturesSection.tsx
    │   │   │   ├── DemoSection.tsx
    │   │   │   └── FAQSection.tsx
    │   │   └── layout/
    │   │       ├── Header.tsx
    │   │       └── Footer.tsx
    │   └── lib/
    │       ├── api.ts          # Backend API calls (health, session, chat)
    │       └── types.ts        # Shared TypeScript types
    └── package.json
```

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- OpenAI API key
- Redis (or Upstash free tier)

### Backend

```bash
# From 01_Projects/ — uses shared venv
.venv\Scripts\activate           # Windows
source .venv/bin/activate        # macOS/Linux

cd 01_Medical_Triage_Chatbot/backend
pip install -r requirements.txt

# Create .env
echo REDIS_URL=redis://localhost:6379 > .env

uvicorn main:app --reload --port 8000
```

Health check: `http://localhost:8000/health`  
Interactive docs: `http://localhost:8000/docs`

### Frontend

```bash
cd 01_Medical_Triage_Chatbot/frontend
npm install

# Create .env.local
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local

npm run dev
```

Open `http://localhost:3000`, enter your OpenAI API key, and start a session.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |
| `POST` | `/session/new` | Create session → returns `session_id` + welcome message |
| `DELETE` | `/session/{id}` | Delete session from Redis |
| `POST` | `/chat` | Send message → returns `ChatResponse` |

### Chat Request / Response

```json
// POST /chat
{
  "session_id": "uuid",
  "message": "I have chest pain",
  "api_key": "sk-..."
}

// Response (interview turn)
{
  "session_id": "uuid",
  "message": "How long have you had the chest pain?",
  "type": "question",
  "triage_level": null,
  "probable_conditions": null,
  "recommendations": null
}

// Response (final triage)
{
  "session_id": "uuid",
  "message": "🔴 EMERGENCY — Seek immediate emergency care.",
  "type": "triage",
  "triage_level": "emergency",
  "probable_conditions": ["Myocardial infarction", "Unstable angina", "Aortic dissection"],
  "recommendations": ["Call 911 immediately", "Do not drive yourself", "Chew aspirin if not allergic"]
}
```

---

## Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Backend | Render (free tier) | Set `REDIS_URL` env var in dashboard |
| Frontend | Vercel / Netlify | Set `NEXT_PUBLIC_API_URL` to Render URL |
| Redis | Upstash (free tier) | TLS `rediss://` URL, 24h session TTL |

---

## Tech Stack Detail

**Backend**
- `langchain-openai` — LLM nodes
- `langgraph` — StateGraph orchestration
- `chromadb` — in-memory vector store
- `sentence-transformers` — local embeddings (all-MiniLM-L6-v2)
- `fastapi` + `uvicorn` — async REST API
- `redis` — session persistence (Upstash TLS)
- `pydantic-settings` — typed config from env

**Frontend**
- `next` 16 + `react` 19
- `framer-motion` 12 — animations
- `tailwindcss` 4 — CSS-first config
- `lucide-react` — icons
- `@tanstack/react-query` — server state

---

## About

Built by **[Ali Haider](https://linkedin.com/in/alihaider678)** as part of an AI engineering portfolio.  
This project demonstrates agentic orchestration, RAG pipelines, dual-model cost optimisation, and production-grade session management.

> **Disclaimer:** This tool is for educational and portfolio demonstration purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment.