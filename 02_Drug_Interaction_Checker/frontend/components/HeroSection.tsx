"use client";

import { motion, type Transition } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, FlaskConical, Shield, Zap, FileText, ArrowDown } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const STATS = [
  { value: "10K+", label: "Drug Pairs Indexed" },
  { value: "3", label: "Parallel AI Agents" },
  { value: "<60s", label: "Full Report Time" },
  { value: "100%", label: "BYOK — Key Never Stored" },
];

const PREVIEW_INTERACTIONS = [
  { a: "Warfarin", b: "Aspirin", sev: "severe", label: "SEVERE" },
  { a: "Warfarin", b: "Ibuprofen", sev: "severe", label: "SEVERE" },
  { a: "Aspirin", b: "Ibuprofen", sev: "moderate", label: "MODERATE" },
];

const SEV_COLORS: Record<string, string> = {
  severe: "bg-red-500/20 border border-red-500/40 text-red-600 dark:text-red-400",
  moderate: "bg-amber-500/15 border border-amber-500/35 text-amber-700 dark:text-amber-400",
  minor: "bg-green-500/15 border border-green-500/30 text-green-700 dark:text-green-400",
};

function floatProps(delay: number) {
  const transition: Transition = { duration: 6, delay, repeat: Infinity, ease: "easeInOut" };
  return { animate: { y: [0, -12, 0] }, transition };
}

export default function HeroSection({ onStartAnalysis }: { onStartAnalysis: () => void }) {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-[var(--page-bg)]">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-60" />

      {/* Glowing orbs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" as const }}
        className="absolute top-[-80px] right-[-80px] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "var(--orb-brand)", filter: "blur(140px)" }}
      />
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" as const }}
        className="absolute bottom-0 left-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "var(--orb-accent)", filter: "blur(120px)" }}
      />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-8 lg:px-16 py-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-col)] to-[#a78bfa] flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-[var(--text-head)] tracking-tight">
            Rx<span className="text-[var(--accent-col)]">Safe</span> AI
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-col)] bg-[var(--section-bg)] text-xs text-[var(--text-muted)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-[var(--accent-col)] opacity-80" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent-col)]" />
            </span>
            Live System — OpenFDA + PubMed
          </div>
          <ThemeToggle />
          <Button
            onClick={onStartAnalysis}
            size="sm"
            className="bg-[var(--accent-col)] hover:opacity-90 text-white font-semibold rounded-lg"
          >
            Analyze Drugs
          </Button>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-8 lg:px-16 py-16 lg:py-24 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" as const }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-bg)] text-sm text-[var(--accent-col)] mb-8 font-medium"
            >
              <Zap className="w-3.5 h-3.5" />
              Parallel LangGraph Agents · Real-Time FDA + PubMed Data
            </motion.div>

            <h1 className="text-5xl lg:text-[4.5rem] font-bold tracking-tight text-[var(--text-head)] leading-[1.06] mb-6">
              Drug Safety
              <br />
              <span className="bg-gradient-to-r from-[var(--accent-col)] via-[#60a5fa] to-[#a78bfa] bg-clip-text text-transparent">
                Intelligence.
              </span>
            </h1>

            <p className="text-lg text-[var(--text-muted)] leading-relaxed mb-10 max-w-lg">
              Parallel AI agents simultaneously query the{" "}
              <span className="text-[var(--text-body)]">FDA drug database</span> and{" "}
              <span className="text-[var(--text-body)]">PubMed research papers</span>.
              An autonomous research loop re-analyses low-confidence results.
              Output: clinician-grade PDF safety report in under 60 seconds.
            </p>

            <div className="flex flex-wrap gap-2 mb-10">
              {[
                "LangGraph Parallel Agents",
                "GPT-4o Clinical Analysis",
                "OpenFDA Live Data",
                "PubMed Literature",
                "BYOK — Zero Key Storage",
                "Async Job Queue",
                "Redis Caching",
              ].map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="border-[var(--border-col)] text-[var(--text-muted)] bg-[var(--section-bg)] text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <Button
              onClick={onStartAnalysis}
              className="bg-[var(--accent-col)] hover:opacity-90 text-white font-bold px-8 py-6 text-base rounded-xl glow-cyan transition-all duration-300 hover:scale-[1.02]"
            >
              Start Drug Safety Analysis
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-14 pt-10 border-t border-[var(--border-col)]">
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                >
                  <div className="text-2xl font-bold text-[var(--text-head)]">{s.value}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1 leading-tight">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — Floating preview card */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="hidden lg:block"
          >
            <motion.div {...floatProps(0)} className="relative">
              {/* Main preview card — always glass-styled */}
              <div className="glass rounded-2xl p-6 glow-cyan">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-head)]">Safety Report</div>
                      <div className="text-xs text-[var(--text-muted)]">3 drugs · 3 pairs analyzed</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-red-500/15 border border-red-500/25 text-red-600 dark:text-red-400 text-xs font-bold tracking-wider">
                    HIGH RISK
                  </div>
                </div>

                {/* Drug chips */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {["Warfarin", "Aspirin", "Ibuprofen"].map((d) => (
                    <span
                      key={d}
                      className="px-2.5 py-1 rounded-lg border border-[var(--border-col)] bg-[var(--section-bg)] text-[var(--text-body)] text-xs font-medium"
                    >
                      {d}
                    </span>
                  ))}
                </div>

                {/* Interaction rows */}
                <div className="space-y-2.5 mb-5">
                  {PREVIEW_INTERACTIONS.map((row) => (
                    <div
                      key={row.a + row.b}
                      className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-col)] bg-[var(--section-bg)]"
                    >
                      <div className="text-sm text-[var(--text-muted)]">
                        <span className="text-[var(--text-head)] font-medium">{row.a}</span>
                        {" + "}
                        <span className="text-[var(--text-head)] font-medium">{row.b}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold tracking-wide ${SEV_COLORS[row.sev]}`}>
                        {row.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* PDF button */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)]">
                  <FileText className="w-4 h-4 text-[var(--accent-col)]" />
                  <span className="text-sm text-[var(--accent-col)]">PDF Safety Report Ready</span>
                  <span className="ml-auto text-xs text-[var(--text-muted)]">Download →</span>
                </div>
              </div>

              {/* Floating badges */}
              <motion.div
                {...floatProps(1.5)}
                className="absolute -top-5 -right-5 glass-light rounded-xl px-3 py-2 text-xs text-[var(--accent-col)] border border-[var(--accent-border)]"
              >
                <span className="text-[var(--text-muted)]">OpenFDA →</span> 2 labels found
              </motion.div>
              <motion.div
                {...floatProps(3)}
                className="absolute -bottom-4 -left-4 glass-light rounded-xl px-3 py-2 text-xs text-[#a78bfa] border border-[#a78bfa]/20"
              >
                PubMed · 6 papers retrieved
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="relative z-10 flex justify-center pb-10"
      >
        <button
          onClick={onStartAnalysis}
          className="flex flex-col items-center gap-1 text-[var(--text-muted)] hover:text-[var(--accent-col)] transition-colors"
        >
          <span className="text-xs">Try it now</span>
          <ArrowDown className="w-4 h-4" />
        </button>
      </motion.div>
    </section>
  );
}