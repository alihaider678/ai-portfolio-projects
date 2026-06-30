# RxSafe AI — Drug Interaction & Prescription Safety Checker

> **AI Portfolio Project 02** | Domain: Healthcare / Clinical Decision Support

A production-grade drug interaction checker powered by parallel LangGraph agents. It simultaneously queries the US FDA drug label database (OpenFDA) and PubMed research papers, runs an autonomous re-analysis loop when confidence is low, and generates a clinician-grade PDF safety report — all in under 60 seconds.

**BYOK (Bring Your Own Key):** Your OpenAI API key is provided in the UI per request. It is never stored server-side, never written to disk, and never logged.

---

## Live Architecture

```
Browser (Next.js 15)
  └─► FastAPI (Rate Limit → Job Queue)
        └─► LangGraph StateGraph
              ├─► [Parallel] analyze_pair × N  (one per drug combination)
              │     ├─► OpenFDA API  (FDA drug label database)
              │     ├─► PubMed E-utilities  (NCBI research papers)
              │     └─► GPT-4o  (board-certified pharmacologist persona)
              │           └─► [Loop] confidence < 0.6 → fetch 3 more papers → re-analyse (max ×2)
              └─► synthesis_node  (aggregate all pair results)
                    └─► ReportLab PDF generation
```

---

## Key Features

| Feature | Detail |
|---|---|
| Parallel LangGraph agents | `Send()` API fans out one `analyze_pair` node per drug combination simultaneously |
| Agentic research loop | If GPT-4o returns confidence < 0.6, fetches 3 more PubMed papers and re-analyses (up to 2 extra rounds) |
| Real data sources | Live OpenFDA API + PubMed E-utilities — no mock data, no static databases |
| Async job queue | POST `/analyze` returns `job_id` instantly; client polls `/jobs/{id}` |
| Redis caching | Drug pair results cached 6 h by alphabetically sorted name key |
| Sliding-window rate limit | 5 requests / 60 s per IP via Redis sorted set |
| PDF report | ReportLab-generated report with interaction matrix, PubMed refs, prescriber recommendations |
| BYOK security | OpenAI API key flows only through request state — never persisted |

---

## Tech Stack

**Backend**
- Python 3.11 · FastAPI 0.115 · Uvicorn
- LangGraph 0.2 · LangChain OpenAI
- OpenFDA API · PubMed E-utilities (NCBI)
- Upstash Redis (job queue + cache + rate limit)
- ReportLab (PDF generation)
- Pydantic v2 · asyncio semaphores · correlation ID middleware

**Frontend**
- Next.js 15 · TypeScript · Tailwind CSS v4
- ShadCN UI · Framer Motion
- next-themes (light / dark mode)
- Polling UI with pipeline step visualization

---

## Project Structure

```
02_Drug_Interaction_Checker/
├── backend/                  # FastAPI + LangGraph service
│   ├── agents/               # LangGraph graph, state, nodes
│   │   └── nodes/            # decompose, pair_agent, synthesis, report
│   ├── api/v1/               # analyze + health endpoints
│   ├── core/                 # config, logger, Redis client, rate limiter, job queue, cache
│   ├── models/               # Pydantic request/response models
│   ├── services/             # OpenFDA + PubMed API clients
│   ├── main.py               # FastAPI app entry point
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 # Next.js 15 application
│   ├── app/                  # App Router pages + globals.css
│   ├── components/           # HeroSection, DemoSection, TechStackSection, FAQSection, SiteFooter, ThemeToggle
│   ├── lib/                  # api.ts, types.ts
│   └── .env.local.example
└── README.md
```

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Upstash Redis account (free tier works)
- OpenAI API key (you supply this per-request in the UI)

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env — add your REDIS_URL and PUBMED_EMAIL
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Docs available at `http://localhost:8001/docs`

### 2. Frontend

```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8001" > .env.local

npm run dev
```

Open `http://localhost:3000`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `REDIS_URL` | Yes | — | Upstash Redis URL (`rediss://...`) |
| `PUBMED_EMAIL` | Yes | — | Email for NCBI E-utilities (required by NCBI) |
| `RATE_LIMIT_REQUESTS` | No | `5` | Max requests per window per IP |
| `RATE_LIMIT_WINDOW` | No | `60` | Rate limit window in seconds |
| `JOB_TTL` | No | `7200` | Job result TTL in Redis (seconds) |
| `DRUG_CACHE_TTL` | No | `21600` | Drug pair cache TTL in Redis (6 h) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:8001` | Backend base URL |

---

## API Endpoints

```
POST /api/v1/analyze          Submit drug analysis job → returns job_id
GET  /api/v1/jobs/{id}        Poll job status (pending / running / complete / failed)
GET  /api/v1/jobs/{id}/report Download PDF safety report
GET  /api/v1/health           Redis + service health check
```

---

## Security Model

- **BYOK:** OpenAI key provided per request in JSON body — never stored, never logged, exists only in memory for the duration of that request
- `.env` and `.env.local` are git-ignored
- Rate limiting prevents abuse (5 req / 60 s per IP)
- No user accounts, no data persistence beyond job TTL

---

## Disclaimer

RxSafe AI is a portfolio demonstration tool that uses real FDA and PubMed data. It is **not validated for clinical decision-making** and is **not a substitute** for licensed pharmacist or physician advice.

---

*Part of the [AI Portfolio Projects](https://github.com/alihaider678/ai-portfolio-projects) — 11-project showcase of production-grade AI engineering.*