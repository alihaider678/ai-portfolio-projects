# MedAI Nexus — Frontend

Next.js 16 + React 19 frontend for the Multimodal Medical Reference Agent. Modern medical UI with dark/light themes, three capability tabs, and a BYOK key modal.

## Requirements

- Node.js 18.18+ (Node 20+ recommended)

## Setup

```bash
npm install

# Point the app at your backend
echo NEXT_PUBLIC_API_URL=http://localhost:8002/api/v1 > .env.local
```

## Run

```bash
# Development (hot reload — heavier)
npm run dev

# Production (recommended, much lighter on low-end machines)
npm run build
npm start
```

Open http://localhost:3000

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8002/api/v1` (local) / `https://<render-app>.onrender.com/api/v1` (prod) |

> OpenAI / ElevenLabs keys are entered in the UI (BYOK) — never stored in env or code.

## Features

- **Prescription Reader** — upload image or record voice → drug interactions → spoken result
- **PDF Knowledge Base** — upload medical PDFs (text + diagrams) into ChromaDB
- **Ask Knowledge Base** — multimodal RAG: image + text + spoken answer
- Dark / light theme toggle · fully theme-aware color system · Space Grotesk type
- FAQ, animated hero, responsive layout

## Structure

```
frontend/
├── app/            # layout.tsx, page.tsx, globals.css (theme tokens)
├── components/
│   ├── Header, Hero, MainApp, HowItWorks, FAQ, Footer
│   ├── ThemeProvider, ThemeToggle, ApiKeysModal
│   └── tabs/        # PrescriptionTab, KnowledgeIngestTab, KnowledgeQueryTab
├── context/         # ApiKeysContext
└── lib/             # api.ts (backend client)
```

## Deploy to Vercel

1. Import the repo → set **Root Directory** to `11_Multimodal_Medical_Agent/frontend`
2. Framework preset: **Next.js** (auto-detected)
3. Environment variable: `NEXT_PUBLIC_API_URL` = your live Render backend URL + `/api/v1`
4. Deploy. Vercel handles build (`next build`) and hosting automatically.