"use client";

import { motion } from "framer-motion";
import { Workflow, Plug, Eye, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

const NODES = [
  { id: "parse", label: "parse_query", desc: "Extract product + destination" },
  { id: "country", label: "check_country_status", desc: "OFAC sanctions lookup", tool: true },
  { id: "product", label: "classify_control_category", desc: "US CCL classification", tool: true },
  { id: "decide", label: "combine_and_decide", desc: "Apply the decision matrix" },
];

const BRANCHES = [
  { label: "explain — clear", icon: ShieldCheck, cls: "out-clear", tag: "NOT_REQUIRED" },
  { label: "explain — required", icon: ShieldAlert, cls: "out-required", tag: "LICENSE_REQUIRED" },
  { label: "explain — prohibited", icon: ShieldX, cls: "out-prohibited", tag: "PROHIBITED" },
];

const PILLARS = [
  { icon: Workflow, title: "LangGraph orchestration",
    body: "A stateful graph runs the steps in order and branches at the decision node into three explanation paths — the reasoning is inspectable, not a single opaque call." },
  { icon: Plug, title: "MCP tools",
    body: "The country and product checks are exposed as Model Context Protocol tools. The same graph runs them in-process (web) or over MCP (agent demo) — identical results." },
  { icon: Eye, title: "LangSmith tracing",
    body: "Every run is traced to LangSmith: each node, tool call, latency and token cost — full observability over the agent's behaviour in production." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="relative mesh max-w-6xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-12">
        <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--accent)" }}>
          How it works
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-strong)] mt-2">
          An auditable reasoning graph
        </h2>
        <p className="text-[var(--text-muted)] mt-3 max-w-xl mx-auto">
          Not a chatbot guessing — a deterministic LangGraph agent that shows its work and cites the rules.
        </p>
      </div>

      {/* The graph */}
      <div className="card rounded-3xl p-6 sm:p-8 mb-10">
        <div className="flex flex-col lg:flex-row items-stretch gap-3">
          {/* linear chain */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {NODES.map((n, i) => (
              <motion.div key={n.id}
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card-solid rounded-xl p-3.5 flex items-center gap-3">
                <span className="text-xs font-mono w-5 text-[var(--text-faint)]">{i + 1}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-[var(--text-strong)] truncate">{n.label}</span>
                    {n.tool && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0"
                        style={{ borderColor: "var(--border-strong)", color: "var(--accent)", background: "var(--accent-soft)" }}>
                        MCP
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--text-faint)]">{n.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* branch connector */}
          <div className="hidden lg:flex items-center px-2 text-[var(--text-faint)]">
            <svg width="40" height="160" viewBox="0 0 40 160" fill="none">
              <path d="M0 80 H20 M20 80 V20 H40 M20 80 H40 M20 80 V140 H40"
                stroke="var(--border-strong)" strokeWidth="1.5" className="flowline" />
            </svg>
          </div>

          {/* branches */}
          <div className="flex-1 grid grid-cols-1 gap-3 justify-center content-center">
            <div className="text-xs text-[var(--text-faint)] font-mono mb-1">conditional edge → outcome</div>
            {BRANCHES.map((b, i) => (
              <motion.div key={b.tag}
                initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className={`rounded-xl border p-3 flex items-center gap-3 ${b.cls}`}>
                <b.icon className="w-5 h-5 shrink-0" />
                <div>
                  <div className="font-mono text-sm font-semibold">{b.label}</div>
                  <div className="text-[11px] opacity-80">{b.tag}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Pillars */}
      <div className="grid md:grid-cols-3 gap-4">
        {PILLARS.map((p, i) => (
          <motion.div key={p.title}
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: i * 0.08 }} className="card rounded-2xl p-6">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "var(--accent-soft)" }}>
              <p.icon className="w-5 h-5" style={{ color: "var(--accent)" }} />
            </div>
            <h3 className="font-semibold text-[var(--text-strong)]">{p.title}</h3>
            <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">{p.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}