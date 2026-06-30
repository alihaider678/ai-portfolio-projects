# RxSafe AI — Backend

FastAPI + LangGraph backend for the Drug Interaction & Prescription Safety Checker.

## What It Does

1. Receives a list of drugs + patient profile + OpenAI API key via `POST /api/v1/analyze`
2. Returns a `job_id` immediately (async job queue pattern)
3. Runs a LangGraph `StateGraph` in the background:
   - Decomposes the drug list into all unique pairs
   - Fans out **one `analyze_pair` agent per pair** using LangGraph's `Send()` API (true parallelism)
   - Each agent queries **OpenFDA** and **PubMed** in parallel, then calls **GPT-4o** with a board-certified pharmacologist persona
   - If GPT-4o returns confidence < 0.6, the agent fetches 3 more PubMed papers and re-analyses (up to 2 extra rounds)
   - A synthesis node aggregates all pair results into an overall risk assessment
   - A ReportLab node generates a PDF safety report
4. Client polls `GET /api/v1/jobs/{id}` until `status == "complete"`

## Stack

| Layer | Technology |
|---|---|
| API framework | FastAPI 0.115 + Uvicorn |
| AI orchestration | LangGraph 0.2 (`StateGraph`, `Send()`, `operator.add`) |
| LLM | GPT-4o via LangChain OpenAI (BYOK) |
| External data | OpenFDA REST API + PubMed NCBI E-utilities |
| Cache / queue | Upstash Redis (job results, drug-pair cache, rate limiting) |
| PDF generation | ReportLab 4.2 |
| Validation | Pydantic v2 |
| Async | asyncio + `asyncio.Semaphore` (15 QPS FDA, 3 QPS PubMed) |

## Project Layout

```
backend/
├── main.py               # FastAPI app, CORS, correlation-ID middleware
├── requirements.txt
├── .env.example
├── agents/
│   ├── graph.py          # LangGraph StateGraph definition
│   ├── state.py          # Shared state type (TypedDict + Annotated lists)
│   └── nodes/
│       ├── decompose.py  # Splits drugs into pairs, emits Send() calls
│       ├── pair_agent.py # Per-pair: OpenFDA + PubMed + GPT-4o + agentic loop
│       ├── synthesis.py  # Aggregates pair results → overall risk
│       └── report.py     # ReportLab PDF generation
├── api/v1/
│   ├── analyze.py        # POST /analyze, GET /jobs/{id}, GET /jobs/{id}/report
│   └── health.py         # GET /health
├── core/
│   ├── config.py         # Pydantic Settings (reads .env)
│   ├── logger.py         # Structlog JSON logger + correlation ID ContextVar
│   ├── redis_client.py   # Async Redis connection singleton
│   ├── rate_limiter.py   # Sliding-window rate limiter (Redis sorted set)
│   ├── job_queue.py      # Job store (Redis hash) — create/update/fetch
│   └── drug_cache.py     # Drug pair cache (Redis string, 6 h TTL)
├── models/
│   └── requests.py       # AnalyzeRequest, PatientProfile Pydantic models
└── services/
    ├── openfda.py        # OpenFDA API client (3 fallback query strategies)
    └── pubmed.py         # PubMed E-utilities client (esearch + efetch)
```

## Setup

```bash
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Fill in REDIS_URL and PUBMED_EMAIL
```

## Running

```bash
# Development
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Production
uvicorn main:app --host 0.0.0.0 --port 8001 --workers 2
```

Interactive docs: `http://localhost:8001/docs`

## Environment Variables

```bash
# Required
REDIS_URL=rediss://your-upstash-endpoint:6380   # Upstash Redis TLS URL
PUBMED_EMAIL=you@example.com                     # Required by NCBI E-utilities

# Optional (defaults shown)
RATE_LIMIT_REQUESTS=5     # Max requests per window per IP
RATE_LIMIT_WINDOW=60      # Window duration in seconds
JOB_TTL=7200              # Job TTL in Redis (2 h)
DRUG_CACHE_TTL=21600      # Drug pair cache TTL (6 h)
```

## API Reference

### `POST /api/v1/analyze`

```json
{
  "drugs": ["warfarin", "aspirin", "ibuprofen"],
  "patient_profile": {
    "age": 65,
    "renal_impairment": false,
    "hepatic_impairment": false,
    "pregnant": false,
    "conditions": ["atrial fibrillation"]
  },
  "api_key": "sk-..."
}
```

Returns:
```json
{
  "job_id": "uuid",
  "status": "pending",
  "request_id": "uuid",
  "pairs": 3,
  "message": "Job queued"
}
```

### `GET /api/v1/jobs/{job_id}`

Polls job status. Returns `status: pending | running | complete | failed`.
When complete, includes the full `result` object.

### `GET /api/v1/jobs/{job_id}/report`

Streams the PDF safety report as `application/pdf`.

## Design Decisions

- **Async job queue over sync** — drug analysis takes 30–60 s; a synchronous endpoint would time out load balancers and frustrate users. Immediate `job_id` response + polling is the correct pattern.
- **LangGraph `Send()` for parallelism** — fan-out to N agents at the graph level is cleaner than managing `asyncio.gather` manually and keeps the state machine explicit.
- **`operator.add` on state lists** — LangGraph's reducer pattern lets each `analyze_pair` node append to `pair_results` without locks or races.
- **Agentic loop vs static retry** — low-confidence results trigger more research autonomously. The agent decides when it has enough evidence.
- **Redis for everything** — single external dependency handles job storage, result caching, and rate limiting. Simplifies ops.