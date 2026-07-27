"use client";

import { motion } from "framer-motion";
import {
  Inbox, Lightbulb, ListChecks, Scale, Database, Gavel, BrainCircuit, CornerDownLeft,
} from "lucide-react";

const NODES = [
  { icon: Inbox, label: "Ingest" },
  { icon: Lightbulb, label: "Triage" },
  { icon: ListChecks, label: "Run check" },
  { icon: Scale, label: "Evaluate" },
  { icon: Database, label: "Precedent" },
  { icon: Gavel, label: "Verdict" },
  { icon: BrainCircuit, label: "Memory" },
];

export default function FlowDiagram() {
  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
        {NODES.map((n, i) => (
          <div key={n.label} className="flex items-center shrink-0">
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex flex-col items-center gap-2 w-20 sm:w-24">
              <div className="w-11 h-11 rounded-xl border-2 flex items-center justify-center card-solid"
                style={{ borderColor: i === 3 ? "var(--warn)" : "var(--border-strong)" }}>
                <n.icon className="w-5 h-5" style={{ color: i === 3 ? "var(--warn)" : "var(--accent)" }} />
              </div>
              <span className="text-[11px] font-medium text-[var(--text-muted)] text-center leading-tight">
                {n.label}
              </span>
            </motion.div>
            {i < NODES.length - 1 && (
              <svg width="28" height="12" className="mx-0.5 shrink-0 -mt-5">
                <line x1="0" y1="6" x2="28" y2="6" stroke="var(--border-strong)" strokeWidth="2" className="flowline" />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Loop-back indicator: evaluate -> run check, when more evidence is needed */}
      <div className="hidden sm:flex items-center gap-1.5 justify-center mt-1 text-[11px] text-[var(--warn)]">
        <CornerDownLeft className="w-3 h-3" />
        <span>evaluate_evidence loops back to run another check when the picture is ambiguous</span>
      </div>
    </div>
  );
}