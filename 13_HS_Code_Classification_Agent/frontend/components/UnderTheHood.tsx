"use client";

import { motion } from "framer-motion";
import {
  MessageSquare, Waypoints, SearchCode, Combine, BrainCircuit,
  Layers, Scale, FileText,
} from "lucide-react";

const STEPS = [
  { icon: MessageSquare, title: "Product query", desc: "A plain-English product description arrives — from the UI, or a natural-language ask to the Hermes Agent." },
  { icon: Waypoints, title: "MCP tool call", desc: "Hermes discovers and calls the custom MCP server (classify_product) over the Model Context Protocol." },
  { icon: SearchCode, title: "Hybrid retrieval", desc: "BM25 keyword search + dense semantic search (OpenAI embeddings in Chroma) over the official HTS descriptions." },
  { icon: Combine, title: "Fuse + rerank", desc: "Reciprocal Rank Fusion merges both rankings; an LLM reranker picks the best HS code and justifies it." },
];

const TECH = [
  { icon: BrainCircuit, title: "Hermes Agent + MCP", desc: "A custom MCP server (classify_product, get_duty_rate, get_hs_details) registered with the Nous Research Hermes Agent — tools discovered automatically." },
  { icon: Layers, title: "Hybrid search", desc: "Sparse BM25 (exact terms) + dense embeddings (semantic intent) cover both literal and paraphrased product descriptions." },
  { icon: Scale, title: "RRF + LLM reranking", desc: "Reciprocal Rank Fusion combines the two retrievers; an LLM reranker with structured JSON output selects and justifies the final code." },
  { icon: FileText, title: "Real tariff data + duties", desc: "Built over the official USITC Harmonized Tariff Schedule, with duty-rate inheritance across the 6-/8-/10-digit hierarchy." },
];

export default function UnderTheHood() {
  return (
    <>
      <section id="how" className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--accent)" }}>Pipeline</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-strong)] mt-2">How it works</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s, i) => (
            <motion.div key={s.title}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08 }} className="card rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "var(--accent-soft)" }}>
                <s.icon className="w-5 h-5" style={{ color: "var(--accent)" }} />
              </div>
              <div className="text-xs text-[var(--text-faint)] mb-1">Step {i + 1}</div>
              <h3 className="font-semibold text-[var(--text-strong)] mb-1">{s.title}</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="tech" className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--accent)" }}>Under the hood</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-strong)] mt-2">Engineering depth</h2>
          <p className="text-[var(--text-muted)] mt-2 max-w-xl mx-auto">
            The hard part of HS classification is precision: the right code hinges on material, construction and use — so retrieval alone isn&apos;t enough.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TECH.map((t, i) => (
            <motion.div key={t.title}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.06 }} className="card rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--accent-soft)" }}>
                <t.icon className="w-5 h-5" style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-strong)] mb-1">{t.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{t.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}