"use client";

import { motion } from "framer-motion";
import {
  MessageSquareText, Globe2, PackageSearch, GitMerge, FileText, Wrench,
} from "lucide-react";
import type { TraceStep, Outcome } from "@/lib/api";

const ICONS: Record<string, React.ElementType> = {
  parse_query: MessageSquareText,
  check_country_status: Globe2,
  classify_control_category: PackageSearch,
  combine_and_decide: GitMerge,
  explain: FileText,
};

function outcomeAccent(outcome: Outcome): string {
  if (outcome === "PROHIBITED") return "var(--stop)";
  if (outcome === "NOT_REQUIRED") return "var(--ok)";
  return "var(--warn)";
}

export default function ReasoningFlow({ trace, outcome }: { trace: TraceStep[]; outcome: Outcome }) {
  return (
    <div className="card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-[var(--text-strong)]">
        <Wrench className="w-4 h-4" style={{ color: "var(--accent)" }} />
        Agent reasoning trace
        <span className="text-xs font-normal text-[var(--text-faint)]">· LangGraph, node by node</span>
      </div>

      <div className="relative pl-1">
        {trace.map((step, i) => {
          const Icon = ICONS[step.step] ?? Wrench;
          const isTool = step.step === "check_country_status" || step.step === "classify_control_category";
          const isFinal = step.step === "explain";
          const isDecide = step.step === "combine_and_decide";
          const accent = isFinal ? outcomeAccent(outcome) : "var(--accent)";
          const last = i === trace.length - 1;

          return (
            <motion.div key={i}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12 }}
              className="relative flex gap-3 pb-4 last:pb-0">
              {/* connector */}
              {!last && (
                <span className="absolute left-[15px] top-8 bottom-0 w-px"
                  style={{ background: "var(--border-strong)" }} />
              )}
              {/* node */}
              <div className="relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{ borderColor: accent, background: "var(--card-solid)" }}>
                <Icon className="w-4 h-4" style={{ color: accent }} />
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[var(--text-strong)]">{step.title}</span>
                  {isTool && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border text-[var(--accent)]"
                      style={{ borderColor: "var(--border-strong)", background: "var(--accent-soft)" }}>
                      tool call
                    </span>
                  )}
                  {isDecide && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border text-[var(--text-muted)]"
                      style={{ borderColor: "var(--border-strong)" }}>
                      decision matrix
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1 leading-relaxed ${isFinal ? "text-[var(--text)]" : "text-[var(--text-muted)]"}`}>
                  {step.detail}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}