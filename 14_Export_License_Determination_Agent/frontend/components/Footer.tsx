"use client";

import { ShieldCheck } from "lucide-react";

const STACK = ["LangGraph", "MCP", "LangSmith", "OpenAI", "FastAPI", "Next.js", "OFAC", "US CCL"];

export default function Footer() {
  return (
    <footer className="border-t mt-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg grad-bg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-[var(--text-strong)] display">
                License<span className="grad-text">Guard</span>
              </div>
              <div className="text-xs text-[var(--text-faint)]">Export-license determination agent</div>
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
            <strong className="text-[var(--text-muted)]">Disclaimer:</strong> Portfolio demonstration built on a
            curated, simplified subset of public OFAC country-sanctions and US Commerce Control List data.
            Decisions are <strong>for guidance only</strong> — real export classifications must be confirmed with a
            licensed export-compliance professional or the relevant authority.
          </p>
          <p>© 2026 LicenseGuard · Built by Ali Haider · AI / Agentic Systems Engineer</p>
        </div>
      </div>
    </footer>
  );
}