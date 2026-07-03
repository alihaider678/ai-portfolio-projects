"use client";

import { ShieldCheck } from "lucide-react";

const STACK = ["Hermes Agent", "MCP", "FastAPI", "Next.js", "RapidFuzz", "Qdrant", "OFAC", "OpenSanctions"];

export default function Footer() {
  return (
    <footer className="border-t mt-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-[var(--text-strong)]">Aegis<span className="grad-text">Screen</span></div>
              <div className="text-xs text-[var(--text-faint)]">Trade sanctions &amp; PEP screening agent</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {STACK.map((s) => (
              <span key={s} className="text-xs px-2.5 py-1 rounded-lg border text-[var(--text-muted)]"
                style={{ background: "var(--surface)" }}>{s}</span>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-xs text-[var(--text-faint)] leading-relaxed">
          <p className="mb-2">
            <strong className="text-[var(--text-muted)]">Disclaimer:</strong> Portfolio demonstration using public data
            (OFAC SDN, OpenSanctions). Not a substitute for a licensed compliance program — screening decisions must be
            reviewed by qualified professionals.
          </p>
          <p>© 2026 AegisScreen · Built by Ali Haider · AI / Agentic Systems Engineer</p>
        </div>
      </div>
    </footer>
  );
}