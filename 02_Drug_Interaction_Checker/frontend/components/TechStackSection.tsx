"use client";

import { motion } from "framer-motion";
import { Zap, Database, Brain, FileText, Shield, Activity, Code2, Server, GitBranch, Cpu, Clock, Lock } from "lucide-react";

const LAYERS = [
  {
    title: "AI Layer",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.25)",
    items: [
      { name: "LangGraph 0.2", icon: GitBranch, detail: "StateGraph with parallel Send() API — one node per drug pair" },
      { name: "GPT-4o", icon: Brain, detail: "Board-certified pharmacologist persona — returns structured JSON" },
      { name: "Agentic Loop", icon: Activity, detail: "Auto-retry if confidence < 0.6 — up to 2 extra research rounds" },
      { name: "LangChain OpenAI", icon: Cpu, detail: "ChatOpenAI with async invoke — BYOK, key never persisted" },
    ],
  },
  {
    title: "Data Sources",
    color: "#0891B2",
    darkColor: "#22d3ee",
    bg: "rgba(34,211,238,0.06)",
    border: "rgba(34,211,238,0.2)",
    items: [
      { name: "OpenFDA API", icon: Database, detail: "US FDA drug label database — real interaction text, no key needed" },
      { name: "PubMed E-utils", icon: FileText, detail: "NCBI research papers — esearch → efetch PMIDs + abstracts" },
      { name: "Semaphore Control", icon: Shield, detail: "asyncio.Semaphore(15) FDA · Semaphore(3) PubMed (NCBI limit)" },
      { name: "Evidence Levels", icon: Activity, detail: "A (RCT) · B (observational) · C (theoretical/case report)" },
    ],
  },
  {
    title: "Backend Engineering",
    color: "#16a34a",
    darkColor: "#4ade80",
    bg: "rgba(74,222,128,0.06)",
    border: "rgba(74,222,128,0.2)",
    items: [
      { name: "FastAPI", icon: Server, detail: "Async endpoints — POST /analyze returns job_id instantly" },
      { name: "Async Job Queue", icon: Clock, detail: "BackgroundTasks — client polls GET /jobs/{id} (2h TTL)" },
      { name: "Rate Limiter", icon: Shield, detail: "Sliding-window Redis sorted set — 5 req/60s per IP" },
      { name: "Correlation IDs", icon: Lock, detail: "ContextVar UUID per request — propagated through all logs" },
    ],
  },
  {
    title: "Infrastructure",
    color: "#d97706",
    darkColor: "#fbbf24",
    bg: "rgba(251,191,36,0.06)",
    border: "rgba(251,191,36,0.2)",
    items: [
      { name: "Upstash Redis", icon: Zap, detail: "Job queue + drug-pair cache (6h TTL) + rate-limit counters" },
      { name: "ReportLab PDF", icon: FileText, detail: "run_in_executor to avoid blocking — interaction matrix + PubMed refs" },
      { name: "Next.js 15", icon: Code2, detail: "App Router · Tailwind CSS · ShadCN UI · Framer Motion" },
      { name: "Render + Vercel", icon: Server, detail: "FastAPI on Render · Next.js on Vercel — fully serverless" },
    ],
  },
];

const ARCH_NODES = [
  { label: "Browser", sub: "Next.js 15", color: "#0891B2", darkColor: "#22d3ee", bg: "rgba(34,211,238,0.08)", border: "rgba(34,211,238,0.25)" },
  { label: "FastAPI", sub: "Rate Limit → Job Queue", color: "#16a34a", darkColor: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.22)" },
  { label: "LangGraph", sub: "Parallel Agents", color: "#7c3aed", darkColor: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)" },
  { label: "OpenFDA + PubMed", sub: "Live Data Sources", color: "#d97706", darkColor: "#fbbf24", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.22)" },
  { label: "GPT-4o", sub: "Clinical Analysis", color: "#7c3aed", darkColor: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.28)" },
  { label: "Redis + PDF", sub: "Cache · Queue · Report", color: "#0891B2", darkColor: "#22d3ee", bg: "rgba(34,211,238,0.08)", border: "rgba(34,211,238,0.22)" },
];

export default function TechStackSection() {
  return (
    <section className="py-24 px-6 lg:px-16 bg-[var(--page-bg)] relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border-col)] bg-[var(--section-bg)] text-sm text-[var(--text-muted)] mb-6">
            <Code2 className="w-3.5 h-3.5 text-[var(--accent-col)]" />
            Full Stack Architecture
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-[var(--text-head)] mb-4">
            What Powers This
          </h2>
          <p className="text-[var(--text-muted)] max-w-2xl mx-auto text-lg">
            Every layer is production-grade — built to demonstrate backend engineering, AI orchestration, and real-world API integration.
          </p>
        </motion.div>

        {/* Architecture flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 mb-16"
        >
          <div className="text-xs text-[var(--text-muted)] mb-6 text-center">Request flow — left to right</div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {ARCH_NODES.map((node, i) => (
              <div key={node.label} className="flex items-center gap-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl border text-center min-w-[110px]"
                  style={{ background: node.bg, borderColor: node.border }}
                >
                  <span className="text-sm font-semibold" style={{ color: node.color }}>
                    {node.label}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] leading-tight">{node.sub}</span>
                </motion.div>
                {i < ARCH_NODES.length - 1 && (
                  <div className="text-[var(--border-col-strong)] text-lg">→</div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tech grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {LAYERS.map((layer, li) => (
            <motion.div
              key={layer.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: li * 0.1 }}
              className="glass rounded-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b" style={{ background: layer.bg, borderColor: layer.border }}>
                <div className="text-sm font-bold tracking-wide" style={{ color: layer.color }}>
                  {layer.title}
                </div>
              </div>
              <div className="p-5 space-y-4">
                {layer.items.map((item, ii) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: li * 0.1 + ii * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div
                        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                        style={{ background: layer.bg, border: `1px solid ${layer.border}` }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: layer.color }} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: layer.color }}>
                          {item.name}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] leading-relaxed mt-0.5">
                          {item.detail}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Backend 4 features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { title: "Async Job Queue", desc: "POST returns job_id instantly. Client polls. No blocking.", color: "#0891B2", icon: Clock },
            { title: "Redis Caching", desc: "Drug pairs cached for 6h. Same pair costs 0 API calls.", color: "#16a34a", icon: Database },
            { title: "Sliding Window Rate Limit", desc: "Redis sorted set. 5 requests per 60s per IP address.", color: "#d97706", icon: Shield },
            { title: "Correlation IDs", desc: "UUID per request. Propagated to every log line. X-Request-ID header.", color: "#7c3aed", icon: Activity },
          ].map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="glass rounded-xl p-4 border-t-2" style={{ borderTopColor: feat.color }}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" style={{ color: feat.color }} />
                  <span className="text-sm font-semibold" style={{ color: feat.color }}>{feat.title}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}