# Medical Triage Chatbot — Backend

FastAPI + LangGraph agentic backend that conducts a structured multi-turn clinical interview and delivers a triage assessment using a dual-model OpenAI pipeline and ChromaDB RAG.

---

## Architecture

```
POST /chat
    │
    ▼
┌──────────────────────────────────────────────────────────────┐
│                    LangGraph StateGraph                      │
│                                                              │
│  ┌─────────────┐    completeness     ┌──────────────────┐   │
│  │  interview  │ ──── check ──────▶ │    retrieval     │   │
│  │  (gpt-4o-   │    (pure logic,    │  (ChromaDB RAG,  │   │
│  │   mini)     │     no LLM call)   │  local embeddings│   │
│  └──────┬──────┘                    └────────┬─────────┘   │
│         │ incomplete → END                   │              │
│         │ (return question)                  ▼              │
│         │                          ┌──────────────────┐    │
│         │                          │    analysis      │    │
│         │                          │   (gpt-4o)       │    │
│         │                          │  structured JSON │    │
│         │                          └──────────────────┘    │
└──────────────────────────────────────────────────────────────┘
    │
    ▼
Redis (Upstash) — session snapshot persisted between turns
```

### State (`TriageState` TypedDict)

| Field | Type | Description |
|-------|------|-------------|
| `messages` | `list[BaseMessage]` | Accumulates with `operator.add` |
| `collected_symptoms` | `dict` | Structured: main_symptom, duration, severity, associated_symptoms |
| `questions_asked` | `list[str]` | Prevents duplicate questions |
| `turn_count` | `int` | Triggers hard cutoff at 8 turns |
| `is_complete` | `bool` | Set by analysis node when triage is done |
| `rag_context` | `str` | Retrieved medical documents |
| `triage_level` | `str \| None` | emergency / urgent / routine |
| `response_text` | `str` | Final message text |
| `response_type` | `str` | "question" or "triage" |
| `api_key` | `str` | BYOK — flows through state, never stored |

---

## Nodes

### `interview_node` — `nodes/interview.py`

- Model: `gpt-4o-mini` (fast, low cost)
- Builds a system prompt with collected symptoms so far and previously asked questions
- Returns JSON `{extracted_symptoms, next_question}`
- Updates `collected_symptoms`, `questions_asked`, `turn_count`
- Sets `response_type = "question"`

### `check_completeness` — `nodes/completeness.py`

Pure Python logic — **no LLM call**:

```python
has_main = bool(collected_symptoms.get("main_symptom"))
has_duration = bool(collected_symptoms.get("duration"))
has_severity = bool(collected_symptoms.get("severity"))
has_associated = bool(collected_symptoms.get("associated_symptoms"))

if (has_main and has_duration and has_severity and has_associated) or turn_count >= 8:
    return "triage"
return "continue"
```

### `retrieval_node` — `nodes/retrieval.py`

- Builds a query string from `collected_symptoms`
- Calls `ChromaDB.query(query_texts=[query], n_results=4)`
- Returns top-4 relevant medical documents as `rag_context`

### `analysis_node` — `nodes/analysis.py`

- Model: `gpt-4o` (accurate, structured)
- Receives full symptom profile + RAG context
- Returns JSON `{triage_level, probable_conditions, recommendations}`
- Conservative fallback: if LLM errors → `triage_level = "urgent"` (never downgrades)
- Sets `response_type = "triage"`, `is_complete = True`

---

## Medical Knowledge Base — `data/seed_medical_kb.py`

21 curated documents seeded into ChromaDB on startup:

| Category | Count | Examples |
|----------|-------|---------|
| Emergency | 8 | Cardiac arrest, stroke, anaphylaxis, respiratory failure, head trauma, meningitis, severe abdominal, overdose |
| Urgent | 7 | High fever, UTI, ear infection, laceration, hypertension crisis, severe headache, moderate abdominal pain |
| Routine | 6 | Cold/flu, minor injury, mild headache, GI issues, skin rash, back pain |

Embeddings: `sentence-transformers/all-MiniLM-L6-v2` — runs locally, no API key needed.

---

## API Reference

### `GET /health`

```json
{ "status": "ok", "service": "medical-triage-chatbot" }
```

### `POST /session/new`

Creates a session and returns a welcome message.

```json
// Response
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "welcome_message": "Hello! I'm your AI triage assistant...",
  "disclaimer": "This is not a substitute for professional medical advice."
}
```

### `DELETE /session/{session_id}`

Removes session from Redis.

### `POST /chat`

```json
// Request
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "I have chest pain and shortness of breath",
  "api_key": "sk-proj-..."
}

// Response — interview turn
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "How long have you been experiencing the chest pain?",
  "type": "question",
  "triage_level": null,
  "probable_conditions": null,
  "recommendations": null
}

// Response — final triage
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "🔴 EMERGENCY — Seek immediate emergency care.",
  "type": "triage",
  "triage_level": "emergency",
  "probable_conditions": ["Myocardial infarction", "Unstable angina", "Aortic dissection"],
  "recommendations": [
    "Call 911 or emergency services immediately",
    "Do not drive yourself to the hospital",
    "Chew aspirin (325mg) if not allergic and not contraindicated"
  ]
}
```

---

## Setup & Running

### Prerequisites

- Python 3.11+
- OpenAI API key (passed per-request by user — BYOK)
- Redis (local or Upstash)

### Install

```bash
# Activate shared venv from 01_Projects/
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
```

> First run downloads the sentence-transformers model (~79 MB). Subsequent runs use the cache.

### Environment

Create `backend/.env`:

```env
# Local Redis
REDIS_URL=redis://localhost:6379

# Upstash (TLS) — recommended for deployment
REDIS_URL=rediss://default:<token>@<host>.upstash.io:6379
```

Optional overrides (defaults shown):

```env
SESSION_TTL=86400
MAX_INTERVIEW_TURNS=8
CHROMA_COLLECTION=medical_kb
INTERVIEW_MODEL=gpt-4o-mini
ANALYSIS_MODEL=gpt-4o
```

### Run

```bash
uvicorn main:app --reload --port 8000
```

Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

**Production:** [medical-triage-backend-8q77.onrender.com](https://medical-triage-backend-8q77.onrender.com)

---

## Deployment (Render)

1. Connect your GitHub repo to Render
2. Set **Root Directory** to `01_Medical_Triage_Chatbot/backend`
3. **Build command:** `pip install -r requirements.txt`
4. **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT` (or uses `Procfile`)
5. Add environment variable: `REDIS_URL` = your Upstash `rediss://` URL

The `Procfile` is already configured:

```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## File Structure

```
backend/
├── agents/
│   └── triage_graph.py       # StateGraph: interview → completeness → retrieval → analysis
├── nodes/
│   ├── interview.py          # gpt-4o-mini interview agent
│   ├── completeness.py       # Pure-logic gate (no LLM call)
│   ├── retrieval.py          # ChromaDB semantic search
│   └── analysis.py           # gpt-4o final triage analysis
├── data/
│   └── seed_medical_kb.py    # 21 medical docs, in-memory ChromaDB singleton
├── memory/
│   └── session_store.py      # Redis load/save/delete with try/except
├── models/
│   └── schemas.py            # TriageState TypedDict + Pydantic request/response models
├── config.py                 # Pydantic Settings (env file + env vars)
├── main.py                   # FastAPI app, lifespan hook, CORS, endpoints
├── requirements.txt
├── Procfile                  # Render deployment
└── runtime.txt               # python-3.11.x
```

---

## Security Notes

- API key flows through `TriageState["api_key"]` on each request — never written to disk or Redis
- `.env` is in `.gitignore` — never committed
- Session data in Redis contains only messages and symptom fields, not the API key
- Redis TTL: 24 hours — sessions auto-expire