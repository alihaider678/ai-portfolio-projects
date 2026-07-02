# 🩺 MedAI Nexus — Multimodal Medical Reference Agent

> AI that **sees, listens, and speaks**. Read handwritten prescriptions, check drug interactions, and query a visual medical knowledge base — every answer delivered as spoken audio.

**AI Portfolio Project 11** — a production-style, multimodal AI system combining vision, speech, retrieval-augmented generation, and a microservices integration.

<!-- Add live links after deployment -->
🔗 **Live Demo:** _coming soon (Vercel)_
🔗 **API:** _coming soon (Render)_ · `/docs` for Swagger

---

## ✨ What it does

Three independent AI capabilities in one unified interface:

### 1. Prescription Reader
Upload a **photo** of a prescription (handwritten or printed) **or record your voice**.
`Image → GPT-4o Vision` / `Voice → Whisper` → extract drug names → **check interactions** → **spoken warning**.

### 2. Mixed-PDF Intelligence
Upload any medical PDF containing **text + diagrams**.
`PyMuPDF` extracts text and embedded images → `GPT-4o Vision` describes each diagram → stored as linked **(text + image)** pairs in ChromaDB.

### 3. Multimodal RAG
Ask a natural-language medical question.
Vector retrieval returns the **image AND text together** (not text alone) → the answer is **read aloud** via TTS.

---

## 🏗️ Architecture

```
                         ┌─────────────────────────────┐
   Browser (Next.js)     │   FastAPI backend (8002)     │
   ┌───────────────┐     │                              │
   │ Prescription  │────▶│  vision (GPT-4o) / whisper   │
   │ PDF Ingest    │────▶│  pdf_parser (PyMuPDF)        │
   │ RAG Query     │────▶│  vector_store (ChromaDB)     │
   └───────────────┘     │  tts (OpenAI / ElevenLabs)   │
        BYOK keys        │  drug_checker ───────────────┼──▶ Project 02 API
                         │  async job queue (Redis)     │    (RxSafe AI, live on Render)
                         └─────────────────────────────┘
```

**Microservices integration:** the Prescription Reader does not re-implement drug-interaction logic — it calls **[Project 02 (RxSafe AI)](https://rxsafe-ai-backend.onrender.com/docs)**, a separately deployed service, over REST. Two independent systems working together.

---

## 🔐 Security — BYOK (Bring Your Own Key)

Your **OpenAI** and **ElevenLabs** API keys are entered in the UI and travel **only** inside each request. They are **never** written to disk, database, Redis, or logs. Inspect the source to verify.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion |
| Backend | FastAPI, Python 3.11, async job queue |
| Vision | OpenAI GPT-4o |
| Speech-to-text | OpenAI Whisper |
| Text-to-speech | OpenAI TTS **or** ElevenLabs (user-selectable) |
| PDF parsing | PyMuPDF |
| Vector store | ChromaDB + OpenAI embeddings (`text-embedding-3-small`) |
| Job queue / cache | Upstash Redis |
| Drug interactions | Project 02 (RxSafe AI) live API |

---

## 🚀 Quick Start (local)

Run the two services in separate terminals. Detailed instructions in each sub-README:

- **[backend/README.md](backend/README.md)** — FastAPI on port 8002
- **[frontend/README.md](frontend/README.md)** — Next.js on port 3000

```bash
# 1. Backend
cd backend
py -3.11 -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python scripts/generate_sample_docs.py            # generate sample medical PDFs
python scripts/generate_sample_prescriptions.py   # generate test prescriptions
uvicorn main:app --port 8002 --reload

# 2. Frontend (new terminal)
cd frontend
npm install
npm run build && npm start
```

Open http://localhost:3000, click **Set API Keys**, and try the three tabs.

---

## 📁 Project Structure

```
11_Multimodal_Medical_Agent/
├── backend/
│   ├── agents/          # prescription_agent, rag_agent
│   ├── api/v1/          # prescription, knowledge, tts, health routes
│   ├── core/            # config, redis, job_queue, logger
│   ├── services/        # vision, whisper, tts, pdf_parser, vector_store, drug_checker
│   ├── scripts/         # sample PDF + prescription + diagram generators
│   └── data/            # sample_docs, sample_prescriptions (knowledge_base is generated)
└── frontend/
    ├── app/             # Next.js app router
    ├── components/      # Header, Hero, tabs, FAQ, Footer…
    ├── context/         # ApiKeys provider
    └── lib/             # API client
```

---

## ⚕️ Disclaimer

This is a **portfolio demonstration**, not a certified medical device. It uses real AI models and real drug-interaction data, but must **not** replace a licensed pharmacist or physician. Always verify AI output with a qualified healthcare professional.

---

_Built by Ali Haider · AI / Agentic Systems Engineer_