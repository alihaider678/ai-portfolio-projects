# MedAI Nexus — Backend

FastAPI backend for the Multimodal Medical Reference Agent. Handles prescription reading (vision + speech), PDF ingestion, multimodal RAG, and text-to-speech, with an async job queue on Redis.

## Requirements

- **Python 3.11** (Pillow / pydantic-core wheels are not available on 3.14 — use 3.11)
- Redis (Upstash TLS recommended)

## Setup

```bash
# From the backend/ folder
py -3.11 -m venv venv
venv\Scripts\activate            # Windows  (source venv/bin/activate on macOS/Linux)
pip install -r requirements.txt

# Create your .env from the template
copy .env.example .env           # then fill in REDIS_URL

# Generate demo assets (one-time)
python scripts/generate_sample_docs.py            # 3 medical procedure PDFs (with diagrams)
python scripts/generate_sample_prescriptions.py   # 3 test prescription images
```

## Run

```bash
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

Docs: http://localhost:8002/docs

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REDIS_URL` | Upstash Redis connection (job queue) | `rediss://...:6379` |
| `DRUG_CHECKER_URL` | Project 02 (RxSafe AI) API base | `https://rxsafe-ai-backend.onrender.com` |
| `CHROMA_PATH` | ChromaDB persistence dir | `./data/knowledge_base` |
| `SAMPLE_DOCS_PATH` | Sample PDF dir | `./data/sample_docs` |
| `RATE_LIMIT_REQUESTS` / `RATE_LIMIT_WINDOW` | Rate limiting | `10` / `60` |

> **API keys are BYOK** — OpenAI and ElevenLabs keys are provided per-request from the UI and are never stored. Do **not** put them in `.env`.

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/prescription/analyze` | Analyze prescription (image/audio) → `job_id` |
| GET | `/api/v1/jobs/{job_id}` | Poll job status/result |
| POST | `/api/v1/knowledge/ingest` | Ingest a PDF into the knowledge base |
| POST | `/api/v1/knowledge/query/tts` | Multimodal RAG query → results + audio |
| GET | `/api/v1/knowledge/docs` | List ingested documents |
| POST | `/api/v1/tts/synthesize` | Text → MP3 (testing) |

## Structure

```
backend/
├── main.py              # FastAPI app, CORS, lifespan, routers
├── agents/              # prescription_agent, rag_agent (orchestration)
├── api/v1/              # route handlers
├── core/                # config, redis_client, job_queue, logger
├── services/            # vision, whisper, tts, pdf_parser, vector_store, drug_checker
├── scripts/             # generate_sample_docs, generate_sample_prescriptions, diagrams
└── data/                # sample_docs, sample_prescriptions (knowledge_base is generated)
```

## Deploy to Render

1. New **Web Service** → root directory `11_Multimodal_Medical_Agent/backend`
2. Build: `pip install -r requirements.txt`
3. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add a `.python-version` file with `3.11` (or set the Python version in Render settings)
5. Environment variables: `REDIS_URL`, `DRUG_CHECKER_URL`
6. After deploy, note the URL and set it as `NEXT_PUBLIC_API_URL` in the frontend.