# Medical Triage Chatbot — Frontend

Next.js 16 + React 19 landing page with a live interactive chat demo. Medical teal theme, ECG animation, multi-turn interview UI, and a colour-coded TriageResultCard for final assessments.

---

## Features

- **Live demo** — full chat interface, no page reload, internal scroll only
- **Two-phase health check** — fast probe (4s) then slow probe (65s) to handle Render free-tier cold starts
- **BYOK UI** — masked API key input, key passed per-request, never stored
- **TriageResultCard** — animated colour-coded card (red/amber/green) with conditions list and numbered recommendations
- **Dark mode** — ThemeProvider with localStorage persistence, toggle in header
- **Fully responsive** — mobile, tablet, and desktop layouts

---

## Pages & Sections

| Section | File | Description |
|---------|------|-------------|
| Hero | `HeroSection.tsx` | ECG animation, triage badges, CTAs, scroll indicator |
| How It Works | `HowItWorksSection.tsx` | 4-step clinical process with connector line |
| Features | `FeaturesSection.tsx` | 6 glow cards: LangGraph, RAG, Dual-Model, etc. |
| Demo | `DemoSection.tsx` | ChatDemo + triage outcomes panel + sample prompts |
| FAQ | `FAQSection.tsx` | 8 accordion questions with colour-coded tags |
| Footer | `Footer.tsx` | Medical disclaimer + credits |

---

## Key Components

### `ChatDemo.tsx`

Full chat interface with:

- Server status indicator (checking → waking → online / offline)
- `createSession()` on start — gets `session_id` + welcome message from backend
- `sendMessage()` — JSON request/response (not streaming)
- Renders `TriageResultCard` when `response.type === 'triage'`
- Internal scroll on new message — page-level scroll is **not** triggered

```tsx
// Scrolls the chat container directly — does not jump the page
const scrollToBottom = () => {
  const el = messagesContainerRef.current
  if (el) el.scrollTop = el.scrollHeight
}
```

### `TriageResultCard.tsx`

Rendered instead of a plain message bubble when the backend returns a triage verdict.

```
┌─────────────────────────────────────┐
│  🔴  EMERGENCY                      │  ← colour-coded header
│  Seek immediate emergency care      │
├─────────────────────────────────────┤
│  Probable Conditions                │
│  › Myocardial infarction            │
│  › Unstable angina                  │
│  › Aortic dissection                │
├─────────────────────────────────────┤
│  Recommendations                    │
│  1. Call 911 immediately            │
│  2. Do not drive yourself           │
│  3. Chew aspirin if not allergic    │
├─────────────────────────────────────┤
│  🛡 AI triage — not a diagnosis     │  ← safety disclaimer
└─────────────────────────────────────┘
```

Colour mapping:

| Level | Colour | Icon |
|-------|--------|------|
| `emergency` | Red `#ef4444` | Siren |
| `urgent` | Amber `#f59e0b` | Clock |
| `routine` | Green `#22c55e` | CheckCircle |

### `ApiKeyInput.tsx`

- Password input (masked by default, toggle to reveal)
- Disabled once session is started (key locked in)
- Never sent to any analytics or logging

### `TypingIndicator.tsx`

Three bouncing dots (`dot-1`, `dot-2`, `dot-3`) with staggered CSS animation while backend processes a turn.

---

## Setup

### Prerequisites

- Node.js 18+
- Backend running on port 8000 (see `backend/README.md`)

### Install & Run

```bash
cd frontend
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm run start
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend base URL | `http://localhost:8000` or Render URL |

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in Vercel dashboard
3. Set **Root Directory** to `01_Medical_Triage_Chatbot/frontend`
4. Add environment variable: `NEXT_PUBLIC_API_URL` = your Render backend URL
5. Deploy

---

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16 | App router, RSC, optimised builds |
| `react` | 19 | UI rendering |
| `framer-motion` | 12 | Animations (entry, hover, TriageCard) |
| `tailwindcss` | 4 | CSS-first config (no `tailwind.config.js`) |
| `lucide-react` | latest | Icons throughout |
| `@tanstack/react-query` | latest | Server state, QueryClientProvider |
| `clsx` + `tailwind-merge` | latest | Conditional class merging (`cn()`) |
| `class-variance-authority` | latest | Button variant system |

---

## File Structure

```
frontend/src/
├── app/
│   ├── page.tsx              # Root page — assembles all sections
│   ├── layout.tsx            # Fonts (Plus Jakarta Sans + Geist Mono), providers
│   └── globals.css           # Medical teal theme, ECG animation, dot bounce
│
├── components/
│   ├── demo/
│   │   ├── ChatDemo.tsx          # Chat window, session lifecycle, message state
│   │   ├── TriageResultCard.tsx  # Colour-coded triage verdict card
│   │   ├── MessageBubble.tsx     # AI / user message bubble
│   │   ├── TypingIndicator.tsx   # Bouncing dots while waiting
│   │   └── ApiKeyInput.tsx       # Masked key input with reveal toggle
│   │
│   ├── sections/
│   │   ├── HeroSection.tsx       # ECG SVG, triage pills, CTA buttons
│   │   ├── HowItWorksSection.tsx # 4-step cards with desktop connector
│   │   ├── FeaturesSection.tsx   # 6 glow feature cards
│   │   ├── DemoSection.tsx       # ChatDemo + info panel layout
│   │   └── FAQSection.tsx        # Accordion with 8 questions
│   │
│   ├── layout/
│   │   ├── Header.tsx            # Sticky nav, theme toggle, GitHub link
│   │   └── Footer.tsx            # Disclaimer, attribution
│   │
│   ├── ThemeProvider.tsx         # Dark/light toggle, localStorage: 'theme-medical'
│   └── ui/
│       ├── button.tsx            # CVA button variants
│       └── textarea.tsx          # Styled textarea
│
└── lib/
    ├── api.ts                # checkHealth, createSession, clearSession, sendMessage
    └── types.ts              # Message, ServerStatus, ChatResponse TypeScript types
```

---

## Design System

### Colour Theme (Medical Teal)

```css
--primary: oklch(0.72 0.155 195)    /* teal — hue 195 */
--background: oklch(0.09 0.022 240) /* near-black with blue tint */
```

### Custom CSS Classes

| Class | Effect |
|-------|--------|
| `.glass` | Glassmorphism card (backdrop blur + translucent border) |
| `.gradient-text` | Teal to green gradient on headings |
| `.glow-teal` | Box shadow glow on primary CTA button |
| `.ecg-path` | SVG stroke animation — ECG sweep across hero |
| `.dot-1 / .dot-2 / .dot-3` | Staggered bounce for typing indicator |
| `.pulse-ring` | Expanding ring animation for status indicators |