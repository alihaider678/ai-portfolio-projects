"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Cpu, Database, Waypoints } from "lucide-react";
import { getStats, type Stats } from "@/lib/api";

export default function Hero() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => { getStats().then(setStats); }, []);

  const fmt = (n?: number) => (n ? n.toLocaleString() : "—");

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-70" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[38rem] h-[38rem] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)" }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-14 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs text-[var(--text-muted)] mb-6"
          style={{ background: "var(--surface)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse" />
          Hermes Agent · MCP · Real OFAC + OpenSanctions data
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, delay: .05 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[var(--text-strong)] leading-[1.08]">
          Screen any party against<br /><span className="grad-text">sanctions &amp; PEP lists</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, delay: .12 }}
          className="mt-5 text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
          An autonomous agent that catches sanctioned entities even under spelling variants,
          aliases, and transliterations — then explains <em>why</em> each hit matched and how confident it is.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .2 }}
          className="mt-8 flex items-center justify-center gap-3">
          <a href="#screen"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
            Try the screener <ArrowRight className="w-4 h-4" />
          </a>
          <a href="#how" className="px-6 py-3 rounded-xl font-semibold border text-[var(--text)] hover:border-[var(--accent)]"
            style={{ background: "var(--surface)" }}>
            How it works
          </a>
        </motion.div>

        {/* Live dataset stats */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .5, delay: .3 }}
          className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
          {[
            { icon: Database, label: "Entities screened", value: fmt(stats?.total_entities) },
            { icon: Waypoints, label: "Names + aliases indexed", value: fmt(stats?.indexed_names) },
            { icon: Cpu, label: "Live data sources", value: "OFAC · OpenSanctions" },
          ].map((s) => (
            <div key={s.label} className="card rounded-2xl p-4">
              <s.icon className="w-4 h-4 mx-auto mb-2" style={{ color: "var(--accent)" }} />
              <div className="text-lg font-bold text-[var(--text-strong)]">{s.value}</div>
              <div className="text-xs text-[var(--text-faint)] mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}