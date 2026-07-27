"use client";

import { motion } from "framer-motion";
import { ArrowRight, GitBranch, Database, Repeat } from "lucide-react";
import FlowDiagram from "./FlowDiagram";

const HIGHLIGHTS = [
  { icon: GitBranch, label: "Dynamic tool selection", detail: "picks which check to run, not a fixed pipeline" },
  { icon: Repeat, label: "Evidence loop", detail: "stops only once it has enough signal" },
  { icon: Database, label: "Episodic memory", detail: "retrieves & learns from past verdicts (pgvector)" },
];

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden mesh">
      <div className="radar-sweep" />
      <div className="grid-bg absolute inset-0 z-0" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-14">
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs chip">
          <span className="w-1.5 h-1.5 rounded-full pulse" style={{ background: "var(--accent)" }} />
          Portfolio demo · synthetic wallet transactions, no real financial data
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}
          className="mt-6 text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.06] text-[var(--text-strong)]">
          An agent that <span className="grad-text">investigates</span> fraud —<br className="hidden sm:block" />
          it doesn&apos;t just score it.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.16 }}
          className="mt-5 text-lg max-w-2xl text-[var(--text-muted)]">
          Most fraud systems run every check on every transaction and hand back a black-box
          score. TransactionGuard&apos;s LangGraph agent reasons like an analyst: it forms a
          hypothesis, picks which check to run next, decides when it has enough evidence to
          stop, and checks its own memory of similar past cases before delivering a verdict.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.24 }}
          className="mt-8 flex flex-wrap items-center gap-3">
          <a href="#console" className="btn flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white grad-bg glow">
            Try the live console <ArrowRight className="w-4 h-4" />
          </a>
          <a href="#how" className="px-5 py-3 rounded-xl font-semibold border chip">
            How it works
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-10 grid sm:grid-cols-3 gap-3">
          {HIGHLIGHTS.map((h) => (
            <div key={h.label} className="card rounded-xl p-4 flex items-start gap-3">
              <h.icon className="w-4.5 h-4.5 mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
              <div>
                <div className="text-sm font-semibold text-[var(--text-strong)]">{h.label}</div>
                <div className="text-xs text-[var(--text-faint)] mt-0.5">{h.detail}</div>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-12 card-solid rounded-2xl p-5 sm:p-6">
          <FlowDiagram />
        </motion.div>
      </div>
    </section>
  );
}