# RxSafe AI — Frontend

Next.js 15 frontend for the Drug Interaction & Prescription Safety Checker.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | ShadCN UI (button, card, badge, input, label, separator, tabs, progress, dialog) |
| Animation | Framer Motion |
| Theme | next-themes (light / dark toggle, default dark) |

## Features

- **Hero section** — animated floating preview card, tech tag badges, stats
- **Live demo** — drug tag input (pill UI), patient risk factors, BYOK API key field
- **Pipeline visualization** — terminal-style panel with 8 animated steps as the job runs
- **Polling UI** — POST returns `job_id`; client polls every 2.5 s until `status === "complete"`
- **Interaction matrix** — color-coded grid (contraindicated / severe / moderate / minor / none); click any cell for detail panel
- **PDF download** — one-click download of the ReportLab-generated safety report
- **Light / dark mode** — full CSS variable theming, toggle in navbar
- **Tech Stack section** — architecture flow diagram + 4-column tech grid
- **FAQ** — animated accordion with 8 technical deep-dive questions

## Project Layout

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout — ThemeProvider, fonts, suppressHydrationWarning
│   ├── page.tsx            # Home page — composes all sections
│   └── globals.css         # CSS variables for light/dark themes, severity classes, glass utilities
├── components/
│   ├── HeroSection.tsx     # Landing hero with floating preview card
│   ├── DemoSection.tsx     # Full interactive demo (drug input, pipeline, results)
│   ├── TechStackSection.tsx
│   ├── FAQSection.tsx
│   ├── SiteFooter.tsx
│   ├── ThemeProvider.tsx   # next-themes wrapper
│   ├── ThemeToggle.tsx     # Sun/moon toggle button
│   └── ui/                 # ShadCN generated components
├── lib/
│   ├── api.ts              # submitAnalysis, pollJob, getReportUrl
│   └── types.ts            # TypeScript interfaces (AnalyzeRequest, JobResponse, AnalysisResult, etc.)
├── public/
├── .env.local.example
└── package.json
```

## Setup

```bash
npm install

# Create environment file
cp .env.local.example .env.local
# or manually:
echo "NEXT_PUBLIC_API_URL=http://localhost:8001" > .env.local
```

## Running

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

Open `http://localhost:3000`

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend base URL (e.g. `http://localhost:8001` or deployed Render URL) |

## Theming

The entire UI uses CSS custom properties defined in `app/globals.css`:

- `:root` — light mode (white/navy palette, brand `#0891B2` accent)
- `.dark` — dark mode (deep navy palette, `#22d3ee` accent)
- `.glass` — glassmorphism card style, theme-aware
- Severity classes — `.sev-contraindicated`, `.sev-severe`, `.sev-moderate`, `.sev-minor` etc.

Tailwind's `dark:` prefix uses `@custom-variant dark (&:is(.dark *))` — checks for `.dark` class on an ancestor element (set by next-themes on `<html>`).

## BYOK Security

The OpenAI API key field (`type="password"`) is labeled "never stored, never logged". In `lib/api.ts`, the key is included in the JSON request body and flows to the backend — it is never written to localStorage, cookies, or any server-side storage.

## Build

Zero TypeScript errors. Static page (SSG):
```
Route (app)     Size
○ /             first load JS shared by all
```