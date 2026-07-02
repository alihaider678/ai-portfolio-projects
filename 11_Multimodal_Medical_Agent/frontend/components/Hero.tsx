"use client";

import { motion } from "framer-motion";
import { FileImage, Brain, Mic2, ChevronDown, Sparkles, Shield, Zap } from "lucide-react";

const capabilities = [
  {
    icon: FileImage,
    label: "Prescription Reader",
    desc: "Photo or voice → drug list → interaction check → spoken warning",
    color: "cyan",
    gradient: "from-cyan-500 to-blue-600",
    glow: "shadow-cyan-500/20",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
    textColor: "text-cyan-400",
  },
  {
    icon: Brain,
    label: "Mixed PDF Intelligence",
    desc: "Upload any medical PDF → parse text + diagrams → build knowledge base",
    color: "purple",
    gradient: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/20",
    border: "border-violet-500/30",
    bg: "bg-violet-500/10",
    textColor: "text-violet-400",
  },
  {
    icon: Mic2,
    label: "Multimodal RAG",
    desc: "Ask a question → retrieve image + text together → hear the spoken answer",
    color: "green",
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/20",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    textColor: "text-emerald-400",
  },
];

const stats = [
  { icon: Shield, label: "Drug Interactions", value: "Checked Live" },
  { icon: Zap, label: "GPT-4o Vision", value: "Powered" },
  { icon: Sparkles, label: "TTS Providers", value: "2 Options" },
];

export default function Hero() {
  return (
    <section id="features" className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-16 overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 medical-grid opacity-60" />

      {/* Gradient orbs */}
      {/* Soft glows via radial-gradient only — no blur() filter (GPU-cheap) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 orb-cyan rounded-full pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 orb-blue rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 orb-purple rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 status-live" />
          <span className="text-sm text-cyan-300 font-medium">Multimodal Medical Reference Agent</span>
          <span className="text-xs text-[var(--tx-4)] ml-1">· AI Portfolio Project 11</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[var(--tx-heading)] mb-6 leading-[1.08] tracking-tight"
        >
          Medical AI That{" "}
          <span className="gradient-text-cyan">Sees, Listens</span>
          <br />
          <span className="gradient-text-green">and Speaks</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-[var(--tx-3)] max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Upload a handwritten prescription or speak it aloud. Ask your visual medical knowledge base.
          Get instant drug interaction warnings — all delivered as spoken audio.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <a
            href="#app"
            className="px-8 py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-base transition-all glow-cyan shadow-lg shadow-cyan-500/25 flex items-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Launch the Agent
          </a>
          <a
            href="#how-it-works"
            className="px-8 py-4 rounded-2xl border border-[var(--bd-2)] text-[var(--tx-2)] hover:border-cyan-500/40 hover:text-[var(--tx-heading)] font-semibold text-base transition-all flex items-center gap-2"
          >
            See How It Works
          </a>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-center justify-center gap-6 sm:gap-12 mb-16 flex-wrap"
        >
          {stats.map(s => (
            <div key={s.label} className="flex items-center gap-2 text-[var(--tx-3)]">
              <s.icon className="w-4 h-4 text-cyan-400" />
              <span className="text-sm"><span className="text-[var(--tx-heading)] font-semibold">{s.value}</span> {s.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Capability cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.label}
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.12 }}
              className={`glass-card rounded-2xl p-6 hover:${cap.border} transition-all duration-300 group cursor-default`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cap.gradient} flex items-center justify-center mb-4 shadow-lg ${cap.glow} group-hover:scale-105 transition-transform`}>
                <cap.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`text-xs font-semibold ${cap.textColor} uppercase tracking-widest mb-2`}>
                Capability {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="text-base font-bold text-[var(--tx-heading)] mb-2">{cap.label}</h3>
              <p className="text-sm text-[var(--tx-3)] leading-relaxed">{cap.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scroll arrow */}
      <motion.div
        animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[var(--tx-5)]"
      >
        <ChevronDown className="w-6 h-6" />
      </motion.div>
    </section>
  );
}