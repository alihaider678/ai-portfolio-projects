"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is an export license, in plain terms?",
    a: "Government permission to send certain goods or technology to certain places. Some products (dual-use goods) and some destinations (sanctioned countries) require a license before you can legally export — and getting it wrong can mean heavy fines or criminal liability.",
  },
  {
    q: "How does the agent actually decide?",
    a: "It runs two independent checks — is the destination restricted (OFAC), and is the product controlled (US Commerce Control List) — then applies a decision matrix over the combination. An embargoed destination is prohibited outright; a controlled product needs a license almost everywhere; a restricted destination can require a license even for ordinary goods.",
  },
  {
    q: "What is LangGraph, and why use it here?",
    a: "LangGraph is a framework for building agents as stateful graphs of steps. It lets the agent branch (prohibited / license-required / clear) and — crucially for compliance — makes each step inspectable. You see the reasoning node by node instead of trusting a black-box answer.",
  },
  {
    q: "What is MCP (Model Context Protocol)?",
    a: "An open standard for exposing tools to AI agents. LicenseGuard's country and product checks are published as MCP tools, so any MCP-compatible agent can discover and call them. The same graph runs those tools in-process for the web app, or over MCP in the agent demo — identical results.",
  },
  {
    q: "Do I need to provide an API key?",
    a: "No — the live demo works out of the box. If you'd like the LLM parsing and classification to run on your own OpenAI account, click the key icon in the header and paste your key. It's stored only in your browser and sent directly with your request; it's never logged server-side.",
  },
  {
    q: "Is this legal advice? Is the data complete?",
    a: "No. It's a portfolio demonstration built on a curated, simplified subset of public OFAC and US CCL data — enough to show real cross-referencing logic, not legal-grade completeness. Always confirm real classifications with a licensed export-compliance professional.",
  },
  {
    q: "How is this different from a normal chatbot?",
    a: "A chatbot would guess an answer from memory. LicenseGuard retrieves the actual rules, applies a deterministic decision matrix, cites exactly which rule(s) triggered the outcome, and exposes the full reasoning trace — auditable and repeatable, which is what compliance work demands.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative max-w-3xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-10">
        <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--accent)" }}>
          FAQ
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-strong)] mt-2">Questions, answered</h2>
      </div>

      <div className="space-y-3">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="card rounded-2xl overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left">
                <span className="font-semibold text-[var(--text-strong)]">{f.q}</span>
                <ChevronDown className={`w-5 h-5 shrink-0 text-[var(--text-faint)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                    <p className="px-5 pb-5 text-sm text-[var(--text-muted)] leading-relaxed">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}