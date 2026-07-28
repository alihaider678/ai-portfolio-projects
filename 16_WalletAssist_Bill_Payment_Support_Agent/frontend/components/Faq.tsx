"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const ITEMS = [
  {
    q: "Is this really Keenu's product?",
    a: "No. This is an independent, unofficial portfolio demo — not built, endorsed, or affiliated with Keenu / Wemsol Pvt Ltd. The 38 FAQ answers the agent uses for general questions are real, publicly published content from Keenu's own help page, used here purely to demonstrate genuine RAG grounding instead of made-up answers.",
  },
  {
    q: "Are the accounts and transactions real?",
    a: "No. All account names and transaction data are entirely synthetic, generated for this demo. No real Keenu customer data exists anywhere in this project — only the FAQ text itself is real.",
  },
  {
    q: "How does it decide between a FAQ answer and a transaction lookup?",
    a: "A classification step reads your message first and routes it: general \"how does X work\" questions go to hybrid BM25 + semantic search over the FAQ knowledge base; \"why did my payment fail\" style questions go to a transaction-status lookup instead.",
  },
  {
    q: "What happens if I mention a dispute or fraud?",
    a: "It's flagged for human handoff immediately. This agent is intentionally honest about what it can't resolve — a disputed charge or fraud report needs a real support agent, not a bot pretending to fix it.",
  },
  {
    q: "Why do I need to paste my own OpenAI key?",
    a: "Every chat message runs 1-2 GPT-4o calls. To keep this demo free to run for every visitor without an unbounded personal bill, you either bring your own key (never logged or stored server-side) or use a small rate-limited shared demo key.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-10">
        <div className="eyebrow text-xs font-bold tracking-widest uppercase" style={{ color: "var(--accent)" }}>FAQ</div>
        <h2 className="mt-2 text-3xl font-extrabold text-[var(--text-strong)]">Questions about this project</h2>
      </div>
      <div className="space-y-3">
        {ITEMS.map((item, i) => (
          <div key={item.q} className="panel overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
              <span className="text-sm font-semibold text-[var(--text-strong)]">{item.q}</span>
              <ChevronDown className={`w-4 h-4 shrink-0 text-[var(--text-faint)] transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && (
              <div className="px-5 pb-4 text-sm text-[var(--text-muted)] leading-relaxed">{item.a}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}