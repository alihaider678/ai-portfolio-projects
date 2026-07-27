"use client";

import { motion } from "framer-motion";
import {
  Inbox, Lightbulb, ListChecks, Scale, Database, Gavel, BrainCircuit, CheckCircle2, XCircle,
} from "lucide-react";
import type { ReasoningStep, RiskLevel } from "@/lib/api";

function iconFor(node: string) {
  if (node === "ingest_transaction") return Inbox;
  if (node === "triage_hypothesis") return Lightbulb;
  if (node.startsWith("check:")) return ListChecks;
  if (node === "evaluate_evidence") return Scale;
  if (node === "retrieve_precedent") return Database;
  if (node === "final_verdict") return Gavel;
  if (node === "store_episodic_memory") return BrainCircuit;
  return ListChecks;
}

function titleFor(node: string) {
  if (node.startsWith("check:")) return node.replace("check:", "").replace(/_/g, " ");
  return node.replace(/_/g, " ");
}

function riskAccent(risk?: RiskLevel | null) {
  if (risk === "HIGH") return "var(--stop)";
  if (risk === "MEDIUM") return "var(--warn)";
  if (risk === "LOW") return "var(--ok)";
  return "var(--accent)";
}

export default function ReasoningTrail({ trail, riskLevel }: { trail: ReasoningStep[]; riskLevel?: RiskLevel | null }) {
  return (
    <div className="relative pl-1">
      {trail.map((step, i) => {
        const Icon = iconFor(step.node);
        const isCheck = step.node.startsWith("check:");
        const isFinal = step.node === "final_verdict";
        const isEvaluate = step.node === "evaluate_evidence";
        const triggered = isCheck && (step.detail as { triggered?: boolean } | undefined)?.triggered;
        const accent = isFinal ? riskAccent(riskLevel) : triggered ? "var(--warn)" : "var(--accent)";
        const last = i === trail.length - 1;

        return (
          <motion.div key={`${step.node}-${i}`}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative flex gap-3 pb-4 last:pb-0">
            {!last && (
              <span className="absolute left-[15px] top-8 bottom-0 w-px" style={{ background: "var(--border-strong)" }} />
            )}
            <div className="relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{ borderColor: accent, background: "var(--card-solid)" }}>
              <Icon className="w-4 h-4" style={{ color: accent }} />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold capitalize text-[var(--text-strong)]">
                  {titleFor(step.node)}
                </span>
                {isCheck && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border"
                    style={{ borderColor: "var(--border-strong)", color: triggered ? "var(--warn)" : "var(--ok)" }}>
                    {triggered ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    {triggered ? "triggered" : "clear"}
                  </span>
                )}
                {isEvaluate && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border text-[var(--text-muted)]"
                    style={{ borderColor: "var(--border-strong)" }}>
                    loop decision
                  </span>
                )}
              </div>
              <p className={`text-xs mt-1 leading-relaxed ${isFinal ? "text-[var(--text)]" : "text-[var(--text-muted)]"}`}>
                {step.summary}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}