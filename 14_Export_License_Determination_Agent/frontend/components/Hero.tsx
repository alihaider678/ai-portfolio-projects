"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Workflow, Globe2, PackageCheck } from "lucide-react";
import { getStats, type Stats } from "@/lib/api";

const CELLS: { label: string; cls: string }[] = [
  { label: "OK", cls: "out-clear" }, { label: "LIC", cls: "out-required" }, { label: "NO", cls: "out-prohibited" },
  { label: "LIC", cls: "out-required" }, { label: "LIC", cls: "out-required" }, { label: "NO", cls: "out-prohibited" },
  { label: "LIC", cls: "out-required" }, { label: "LIC", cls: "out-required" }, { label: "NO", cls: "out-prohibited" },
];

export default function Hero() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => { getStats().then(setStats); }, []);
  const fmt = (n?: number) => (n != null ? n.toLocaleString() : "—");

  return (
    <section id="top" className="relative mesh overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-80" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-14 grid lg:grid-cols-[1.15fr_1fr] gap-10 items-center">
        {/* Left: copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs text-[var(--text-muted)] mb-6"
            style={{ background: "var(--surface)" }}>
            <span className="w-1.5 h-1.5 rounded-full pulse" style={{ background: "var(--accent)" }} />
            LangGraph agent · MCP tools · auditable reasoning
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, delay: .05 }}
            className="text-4xl sm:text-6xl font-bold tracking-tight text-[var(--text-strong)] leading-[1.05]">
            Do I need an <span className="grad-text">export license?</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, delay: .12 }}
            className="mt-5 text-lg text-[var(--text-muted)] max-w-xl">
            Enter <strong className="text-[var(--text)]">what you&apos;re shipping</strong> and{" "}
            <strong className="text-[var(--text)]">where it&apos;s going</strong>. LicenseGuard checks the
            destination against OFAC sanctions and the product against US dual-use export controls, then tells
            you whether an export license is required — showing every step of its reasoning, not just a verdict.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .2 }}
            className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#try"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white grad-bg glow">
              Try the agent <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#demo"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold border text-[var(--text)] hover:border-[var(--accent)]"
              style={{ background: "var(--surface)" }}>
              <PlayCircle className="w-4 h-4" /> Watch demo
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .5, delay: .3 }}
            className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
            {[
              { icon: Globe2, v: fmt(stats?.countries_tracked), l: "countries screened" },
              { icon: PackageCheck, v: fmt(stats?.control_categories), l: "CCL control categories" },
              { icon: Workflow, v: "5-node", l: "LangGraph reasoning" },
            ].map((s) => (
              <div key={s.l} className="flex items-center gap-2.5">
                <s.icon className="w-5 h-5" style={{ color: "var(--accent)" }} />
                <div>
                  <div className="text-lg font-bold text-[var(--text-strong)] leading-none">{s.v}</div>
                  <div className="text-xs text-[var(--text-faint)] mt-0.5">{s.l}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: the decision-matrix teaser */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: .6, delay: .15 }}
          className="card glow rounded-3xl p-6 relative">
          <div className="text-xs font-semibold text-[var(--text-muted)] mb-4 flex items-center gap-2">
            <Workflow className="w-4 h-4" style={{ color: "var(--accent)" }} />
            The core idea: it&apos;s the <span className="grad-text">combination</span>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-3">
            <div />
            <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold text-[var(--text-faint)] text-center">
              <span>Unrestricted</span><span>Partial</span><span>Embargoed</span>
            </div>

            {["Uncontrolled", "Dual-use", "Controlled"].map((row, r) => (
              <div key={row} className="contents">
                <div className="text-[10px] font-semibold text-[var(--text-faint)] self-center pr-1 text-right w-20">{row}</div>
                <div className="grid grid-cols-3 gap-2">
                  {CELLS.slice(r * 3, r * 3 + 3).map((c, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + (r * 3 + i) * 0.05 }}
                      className={`h-11 rounded-lg border flex items-center justify-center text-[11px] font-bold ${c.cls}`}>
                      {c.label}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t flex items-center justify-between text-[11px]">
            <Legend cls="dot-clear" label="No license" />
            <Legend cls="dot-required" label="License req." />
            <Legend cls="dot-prohibited" label="Prohibited" />
          </div>
          <p className="text-[11px] text-[var(--text-faint)] mt-3 leading-relaxed">
            Destination (columns) × product control (rows) → outcome. An ordinary laptop is fine to
            most places, but not to an embargoed country; encryption software is controlled almost everywhere.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)]">
      <span className={`w-2 h-2 rounded-full ${cls}`} /> {label}
    </span>
  );
}