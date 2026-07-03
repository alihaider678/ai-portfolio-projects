"use client";

import { motion } from "framer-motion";
import {
  MessageSquare, Waypoints, ScanSearch, ShieldQuestion, BrainCircuit,
  Fingerprint, Scale, Gauge,
} from "lucide-react";

const STEPS = [
  { icon: MessageSquare, title: "Request", desc: "A party name arrives — from the UI or a natural-language ask to the Hermes Agent." },
  { icon: Waypoints, title: "MCP tool call", desc: "Hermes discovers and calls the custom MCP screening server (screen_entity)." },
  { icon: ScanSearch, title: "Fuzzy + phonetic match", desc: "Two-stage RapidFuzz recall → strict rerank, with Metaphone for sound-alikes." },
  { icon: ShieldQuestion, title: "Explainable risk", desc: "Returns a risk level, confidence, and why each hit matched — for analyst review." },
];

const TECH = [
  { icon: BrainCircuit, title: "Hermes Agent + MCP", desc: "Custom MCP server registered with the Nous Research Hermes Agent — tools discovered automatically at startup." },
  { icon: Fingerprint, title: "IDF token weighting", desc: "Generic words (“Shipping”, “Logistics”) are down-weighted vs distinctive ones (“Rosoboron”) to cut false positives." },
  { icon: Scale, title: "Two-stage matching", desc: "Fast token-set recall over 85k names, then a strict whole-name rerank that catches typos, reordering & concatenation." },
  { icon: Gauge, title: "Explainable scoring", desc: "Sanctions weighted above PEP; every match carries a score, confidence, and a plain-English reason." },
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
            The hard part of sanctions screening is precision: catching real hits without drowning analysts in false positives.
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