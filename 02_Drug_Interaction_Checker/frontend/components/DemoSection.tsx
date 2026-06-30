"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  Circle,
  AlertTriangle,
  FileDown,
  RefreshCw,
  Eye,
  EyeOff,
  Info,
  Zap,
  Database,
  Brain,
  FileText,
} from "lucide-react";
import { submitAnalysis, pollJob, getReportUrl } from "@/lib/api";
import type {
  AnalysisResult,
  PatientProfile,
  PairResult,
  SeverityLevel,
} from "@/lib/types";

/* ─── Severity config ───────────────────────────────────────────── */
const SEV_CONFIG: Record<
  SeverityLevel,
  { label: string; cls: string; ring: string; dot: string }
> = {
  contraindicated: {
    label: "CONTRAINDICATED",
    cls: "sev-contraindicated",
    ring: "ring-red-500/40",
    dot: "bg-red-500",
  },
  severe: {
    label: "SEVERE",
    cls: "sev-severe",
    ring: "ring-red-400/30",
    dot: "bg-red-400",
  },
  moderate: {
    label: "MODERATE",
    cls: "sev-moderate",
    ring: "ring-amber-400/30",
    dot: "bg-amber-400",
  },
  minor: {
    label: "MINOR",
    cls: "sev-minor",
    ring: "ring-green-400/30",
    dot: "bg-green-400",
  },
  none: {
    label: "NONE",
    cls: "sev-none",
    ring: "ring-cyan-400/20",
    dot: "bg-cyan-400",
  },
  unknown: {
    label: "UNKNOWN",
    cls: "sev-unknown",
    ring: "ring-gray-500/20",
    dot: "bg-gray-500",
  },
};

const RISK_COLORS: Record<string, string> = {
  HIGH: "text-red-600 dark:text-red-400 bg-red-500/15 border-red-500/30",
  MODERATE: "text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30",
  LOW: "text-green-600 dark:text-green-400 bg-green-500/15 border-green-500/30",
  NONE: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
};

/* ─── Pipeline steps ────────────────────────────────────────────── */
type StepState = "pending" | "running" | "done" | "skipped";

interface PipelineStep {
  id: string;
  label: string;
  detail: string;
  icon: React.ReactNode;
  runningMs: number; // how long this step "runs" before the next
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "rate",
    label: "Rate Limit Check",
    detail: "Sliding-window Redis check — 5 req / 60s per IP",
    icon: <Zap className="w-3.5 h-3.5" />,
    runningMs: 800,
  },
  {
    id: "cache",
    label: "Redis Cache Lookup",
    detail: "Drug-pair cache keyed by alphabetically sorted names (TTL 6h)",
    icon: <Database className="w-3.5 h-3.5" />,
    runningMs: 600,
  },
  {
    id: "job",
    label: "Async Job Queued",
    detail: "Job stored in Redis hash — client polls; background task runs",
    icon: <RefreshCw className="w-3.5 h-3.5" />,
    runningMs: 500,
  },
  {
    id: "fda",
    label: "OpenFDA API Query",
    detail: "Parallel agents hit FDA drug label database (15 QPS semaphore)",
    icon: <Database className="w-3.5 h-3.5" />,
    runningMs: 8000,
  },
  {
    id: "pubmed",
    label: "PubMed Literature Search",
    detail: "NCBI E-utilities fetch abstracts in parallel (3 QPS semaphore)",
    icon: <FileText className="w-3.5 h-3.5" />,
    runningMs: 10000,
  },
  {
    id: "gpt",
    label: "GPT-4o Clinical Analysis",
    detail: "Board-certified pharmacologist persona — returns structured JSON",
    icon: <Brain className="w-3.5 h-3.5" />,
    runningMs: 12000,
  },
  {
    id: "loop",
    label: "Agentic Research Loop",
    detail: "If confidence < 0.6 → fetch 3 more papers and re-analyse (max 2 rounds)",
    icon: <RefreshCw className="w-3.5 h-3.5" />,
    runningMs: 6000,
  },
  {
    id: "pdf",
    label: "PDF Report Generated",
    detail: "ReportLab renders full safety report with interaction matrix",
    icon: <FileDown className="w-3.5 h-3.5" />,
    runningMs: 2000,
  },
];

/* ─── Drug tag input ────────────────────────────────────────────── */
function DrugTagInput({
  drugs,
  onChange,
}: {
  drugs: string[];
  onChange: (d: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function addDrug() {
    const name = input.trim().toLowerCase();
    if (!name || drugs.includes(name) || drugs.length >= 10) return;
    onChange([...drugs, name]);
    setInput("");
  }

  function removeDrug(name: string) {
    onChange(drugs.filter((d) => d !== name));
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addDrug();
    }
    if (e.key === "Backspace" && !input && drugs.length) {
      removeDrug(drugs[drugs.length - 1]);
    }
  }

  return (
    <div>
      <Label className="text-[var(--text-body)] text-sm mb-2 block">
        Medications{" "}
        <span className="text-[var(--text-muted)]">(2–10 drugs, press Enter to add)</span>
      </Label>
      <div className="min-h-[52px] flex flex-wrap gap-2 p-3 rounded-xl border border-[var(--border-col)] bg-[var(--section-bg)] focus-within:border-[var(--accent-col)]/50 transition-colors">
        {drugs.map((d) => (
          <motion.span
            key={d}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#22d3ee]/10 border border-[#22d3ee]/25 text-[var(--accent-col)] text-sm font-medium capitalize"
          >
            {d}
            <button
              onClick={() => removeDrug(d)}
              className="text-[var(--accent-col)]/60 hover:text-[var(--accent-col)] transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.span>
        ))}
        {drugs.length < 10 && (
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            onBlur={addDrug}
            placeholder={drugs.length === 0 ? "e.g. warfarin, aspirin…" : "Add another…"}
            className="flex-1 min-w-[140px] bg-transparent text-sm text-[var(--text-head)] placeholder:text-[var(--text-muted)] outline-none"
          />
        )}
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-xs text-[var(--text-muted)]">
          {drugs.length}/10 medications added
        </p>
        {drugs.length < 2 && (
          <p className="text-xs text-amber-400">Minimum 2 required</p>
        )}
      </div>
    </div>
  );
}

/* ─── Pipeline visualization ────────────────────────────────────── */
function PipelineViz({
  stepStates,
  jobId,
}: {
  stepStates: StepState[];
  jobId: string | null;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-col)] terminal-panel overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 terminal-header">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-amber-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs text-[var(--text-muted)] font-mono ml-2">
          rxsafe-pipeline
          {jobId ? ` · job:${jobId.slice(0, 8)}` : ""}
        </span>
      </div>
      <div className="p-4 space-y-3 font-mono text-xs">
        {PIPELINE_STEPS.map((step, i) => {
          const state = stepStates[i] || "pending";
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: state === "pending" ? 0.35 : 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3"
            >
              {/* State icon */}
              <div className="mt-0.5 shrink-0">
                {state === "done" && (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                )}
                {state === "running" && (
                  <Loader2 className="w-4 h-4 text-[var(--accent-col)] animate-spin" />
                )}
                {state === "pending" && (
                  <Circle className="w-4 h-4 text-[var(--text-muted)]" />
                )}
                {state === "skipped" && (
                  <Circle className="w-4 h-4 text-[var(--text-muted)]" />
                )}
              </div>

              {/* Step info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      state === "done"
                        ? "text-green-400"
                        : state === "running"
                        ? "text-[var(--accent-col)]"
                        : "text-[var(--text-muted)]"
                    }
                  >
                    {step.label}
                  </span>
                  {state === "running" && (
                    <span className="text-[var(--accent-col)]/60 text-[10px] animate-pulse">
                      processing…
                    </span>
                  )}
                  {state === "done" && i < 3 && (
                    <span className="text-green-400/60 text-[10px]">✓</span>
                  )}
                </div>
                <div className="text-[var(--text-muted)] text-[10px] mt-0.5 leading-snug truncate">
                  {step.detail}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Interaction Matrix ────────────────────────────────────────── */
function InteractionMatrix({
  drugs,
  pairs,
  onSelect,
}: {
  drugs: string[];
  pairs: PairResult[];
  onSelect: (p: PairResult | null) => void;
}) {
  function getPair(a: string, b: string): PairResult | undefined {
    return pairs.find(
      (p) =>
        (p.drug_a === a && p.drug_b === b) ||
        (p.drug_a === b && p.drug_b === a)
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-10" />
            {drugs.map((d) => (
              <th key={d} className="pb-2 px-2 text-xs text-[var(--text-muted)] font-medium capitalize text-center">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {drugs.map((rowDrug, ri) => (
            <tr key={rowDrug}>
              <td className="pr-2 py-1 text-xs text-[var(--text-muted)] font-medium capitalize text-right whitespace-nowrap">
                {rowDrug}
              </td>
              {drugs.map((colDrug, ci) => {
                if (ri === ci) {
                  return (
                    <td key={colDrug} className="p-1">
                      <div className="w-full aspect-square rounded-lg bg-[var(--section-bg)] border border-[var(--border-col)] flex items-center justify-center min-w-[44px] min-h-[44px]">
                        <span className="text-[var(--text-muted)] text-lg">—</span>
                      </div>
                    </td>
                  );
                }
                const pair = getPair(rowDrug, colDrug);
                const sev = pair?.severity || "unknown";
                const cfg = SEV_CONFIG[sev];
                return (
                  <td key={colDrug} className="p-1">
                    <button
                      onClick={() => pair && onSelect(pair)}
                      className={`w-full aspect-square rounded-lg border flex flex-col items-center justify-center min-w-[44px] min-h-[44px] transition-all hover:scale-105 hover:ring-2 ${cfg.cls} ${cfg.ring} cursor-pointer`}
                      title={`${rowDrug} + ${colDrug}: ${cfg.label}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${cfg.dot} mb-0.5`} />
                      <span className="text-[9px] font-bold tracking-wide">
                        {cfg.label.slice(0, 3)}
                      </span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Pair detail modal ─────────────────────────────────────────── */
function PairDetail({
  pair,
  onClose,
}: {
  pair: PairResult;
  onClose: () => void;
}) {
  const cfg = SEV_CONFIG[pair.severity];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="glass rounded-xl border p-5 border-[var(--border-col)]"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm text-[var(--text-muted)] mb-1">Interaction Detail</div>
          <div className="text-lg font-semibold text-[var(--text-head)] capitalize">
            {pair.drug_a} + {pair.drug_b}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${cfg.cls}`}>
            {cfg.label}
          </span>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-head)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <div className="text-[var(--text-muted)] text-xs mb-1">Mechanism</div>
          <p className="text-[var(--text-body)] leading-relaxed">{pair.mechanism}</p>
        </div>
        <div>
          <div className="text-[var(--text-muted)] text-xs mb-1">Clinical Effects</div>
          <p className="text-[var(--text-body)] leading-relaxed">{pair.clinical_effects}</p>
        </div>
        <div>
          <div className="text-[var(--text-muted)] text-xs mb-1">Management</div>
          <p className="text-[var(--text-body)] leading-relaxed">{pair.management}</p>
        </div>
        <div className="flex items-center gap-4 pt-2 border-t border-[var(--border-col)]">
          <div className="text-xs text-[var(--text-muted)]">
            Evidence:{" "}
            <span className="text-[var(--accent-col)]">{pair.evidence_level}</span>
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            Confidence:{" "}
            <span className="text-[var(--accent-col)]">
              {Math.round(pair.confidence * 100)}%
            </span>
          </div>
          {pair.cached && (
            <Badge className="text-[10px] bg-[#a78bfa]/10 border-[#a78bfa]/30 text-[#a78bfa]">
              Cached
            </Badge>
          )}
        </div>
        {pair.evidence_sources.length > 0 && (
          <div className="text-xs text-[var(--text-muted)]">
            PubMed:{" "}
            {pair.evidence_sources.map((s) => (
              <a
                key={s.pmid}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-col)] underline decoration-dotted mr-2 hover:decoration-solid"
              >
                PMID {s.pmid}
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Results panel ─────────────────────────────────────────────── */
function ResultsPanel({
  result,
  jobId,
}: {
  result: AnalysisResult;
  jobId: string;
}) {
  const [selectedPair, setSelectedPair] = useState<PairResult | null>(null);
  const riskCls = RISK_COLORS[result.overall_risk] || RISK_COLORS.NONE;

  return (
    <div className="space-y-5">
      {/* Overall risk banner */}
      <div
        className={`flex items-center justify-between p-4 rounded-xl border ${riskCls}`}
      >
        <div>
          <div className="text-xs opacity-70 mb-0.5">Overall Risk Assessment</div>
          <div className="text-xl font-bold">{result.overall_risk} RISK</div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-70 mb-0.5">{result.total_pairs} pairs analyzed</div>
          <div className="text-sm font-medium">
            {result.severity_counts.severe || 0} severe ·{" "}
            {result.severity_counts.moderate || 0} moderate
          </div>
        </div>
      </div>

      {/* Clinical summary */}
      <div className="p-4 rounded-xl border border-[var(--border-col)] bg-[var(--accent-bg)]">
        <div className="text-xs text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
          <Brain className="w-3 h-3" /> GPT-4o Clinical Summary
        </div>
        <p className="text-sm text-[var(--text-body)] leading-relaxed">
          {result.clinical_summary}
        </p>
      </div>

      {/* Interaction matrix */}
      <div>
        <div className="text-xs text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
          <Database className="w-3 h-3" /> Interaction Matrix — click any cell for detail
        </div>
        <InteractionMatrix
          drugs={result.drugs}
          pairs={result.pair_results}
          onSelect={setSelectedPair}
        />
      </div>

      {/* Pair detail */}
      <AnimatePresence>
        {selectedPair && (
          <PairDetail pair={selectedPair} onClose={() => setSelectedPair(null)} />
        )}
      </AnimatePresence>

      {/* PDF download */}
      <a
        href={getReportUrl(jobId)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl border border-[#22d3ee]/30 bg-[#22d3ee]/8 text-[var(--accent-col)] text-sm font-semibold hover:bg-[#22d3ee]/15 transition-all hover:border-[#22d3ee]/50 group"
      >
        <FileDown className="w-4 h-4 group-hover:scale-110 transition-transform" />
        Download PDF Safety Report
      </a>
    </div>
  );
}

/* ─── Main Demo Section ──────────────────────────────────────────── */
const DEFAULT_PATIENT: PatientProfile = {
  age: null,
  renal_impairment: false,
  hepatic_impairment: false,
  pregnant: false,
  conditions: [],
};

type AnalysisState = "idle" | "submitting" | "polling" | "complete" | "failed";

export default function DemoSection({ sectionRef }: { sectionRef: React.RefObject<HTMLDivElement | null> }) {
  const [drugs, setDrugs] = useState<string[]>([]);
  const [patient, setPatient] = useState<PatientProfile>(DEFAULT_PATIENT);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPatient, setShowPatient] = useState(false);
  const [conditionInput, setConditionInput] = useState("");

  const [state, setState] = useState<AnalysisState>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [stepStates, setStepStates] = useState<StepState[]>(
    PIPELINE_STEPS.map(() => "pending")
  );
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    if (pollRef.current) clearInterval(pollRef.current);
    stepTimerRefs.current.forEach(clearTimeout);
    stepTimerRefs.current = [];
  }

  const animateSteps = useCallback((upToIndex: number) => {
    // Mark steps 0..upToIndex as done, upToIndex+1 as running, rest pending
    setStepStates((prev) =>
      prev.map((_, i) => {
        if (i < upToIndex) return "done";
        if (i === upToIndex) return "running";
        return "pending";
      })
    );
  }, []);

  function startStepAnimation(totalMs: number) {
    // First 3 steps happen instantly (job lifecycle)
    setStepStates((prev) =>
      prev.map((_, i) => (i < 3 ? "done" : i === 3 ? "running" : "pending"))
    );

    // Steps 3-7 spread over totalMs (estimated)
    const remainingSteps = PIPELINE_STEPS.length - 3;
    const interval = totalMs / remainingSteps;

    for (let i = 1; i < remainingSteps; i++) {
      const t = setTimeout(() => {
        animateSteps(3 + i);
        setProgress(Math.min(95, 10 + ((3 + i) / PIPELINE_STEPS.length) * 85));
      }, interval * i);
      stepTimerRefs.current.push(t);
    }
  }

  async function handleSubmit() {
    if (drugs.length < 2) return;
    if (!apiKey.trim() || apiKey.trim().length < 20) return;

    clearTimers();
    setState("submitting");
    setError(null);
    setResult(null);
    setProgress(5);
    setStepStates(PIPELINE_STEPS.map(() => "pending"));

    try {
      const submitted = await submitAnalysis({
        drugs,
        patient_profile: patient,
        api_key: apiKey.trim(),
      });

      setJobId(submitted.job_id);
      setState("polling");
      setProgress(10);

      // Start step animation — assume ~40s total
      startStepAnimation(38000);

      // Poll
      pollRef.current = setInterval(async () => {
        try {
          const job = await pollJob(submitted.job_id);

          if (job.status === "complete" && job.result) {
            clearTimers();
            setStepStates(PIPELINE_STEPS.map(() => "done"));
            setProgress(100);
            setResult(job.result);
            setState("complete");
          } else if (job.status === "failed") {
            clearTimers();
            setError(job.error || "Analysis failed");
            setState("failed");
          }
        } catch {
          // transient network error — keep polling
        }
      }, 2500);
    } catch (err) {
      setState("failed");
      setError(err instanceof Error ? err.message : "Submission failed");
    }
  }

  function reset() {
    clearTimers();
    setState("idle");
    setJobId(null);
    setStepStates(PIPELINE_STEPS.map(() => "pending"));
    setResult(null);
    setError(null);
    setProgress(0);
  }

  useEffect(() => () => clearTimers(), []);

  const canSubmit =
    drugs.length >= 2 && apiKey.trim().length >= 20 && state === "idle";

  return (
    <section
      ref={sectionRef}
      id="demo"
      className="py-24 px-6 lg:px-16 bg-[var(--section-bg)] relative overflow-hidden"
    >
      {/* Dot pattern bg */}
      <div className="absolute inset-0 dot-bg opacity-40" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border-col)] bg-[var(--section-bg)] text-sm text-[var(--text-muted)] mb-6">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22d3ee] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#22d3ee]" />
            </span>
            Live Demo — Runs Against Real APIs
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-[var(--text-head)] mb-4">
            Analyze Your Prescriptions
          </h2>
          <p className="text-[var(--text-muted)] max-w-2xl mx-auto text-lg">
            Enter any combination of drugs, optionally add patient risk factors,
            and watch parallel AI agents work in real time.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* ── Left: Input Form ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Drug input */}
            <div className="glass rounded-2xl p-6">
              <DrugTagInput drugs={drugs} onChange={setDrugs} />
            </div>

            {/* Patient profile */}
            <div className="glass rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowPatient((p) => !p)}
                className="w-full flex items-center justify-between px-6 py-4 text-sm text-[var(--text-body)] hover:text-[var(--text-head)] transition-colors"
              >
                <span className="font-medium flex items-center gap-2">
                  <Info className="w-4 h-4 text-[var(--text-muted)]" />
                  Patient Risk Factors{" "}
                  <span className="text-[var(--text-muted)] text-xs">(optional)</span>
                </span>
                {showPatient ? (
                  <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                )}
              </button>

              <AnimatePresence>
                {showPatient && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-[var(--border-col)]"
                  >
                    <div className="p-6 space-y-4">
                      <div>
                        <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">
                          Age
                        </Label>
                        <Input
                          type="number"
                          value={patient.age ?? ""}
                          onChange={(e) =>
                            setPatient((p) => ({
                              ...p,
                              age: e.target.value ? Number(e.target.value) : null,
                            }))
                          }
                          placeholder="Patient age"
                          className="bg-[var(--section-bg)] border-[var(--border-col)] text-[var(--text-head)] placeholder:text-[var(--text-muted)] text-sm"
                        />
                      </div>

                      {[
                        {
                          key: "renal_impairment" as keyof PatientProfile,
                          label: "Renal Impairment",
                        },
                        {
                          key: "hepatic_impairment" as keyof PatientProfile,
                          label: "Hepatic Impairment",
                        },
                        {
                          key: "pregnant" as keyof PatientProfile,
                          label: "Pregnant",
                        },
                      ].map(({ key, label }) => (
                        <label
                          key={key}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <div
                            onClick={() =>
                              setPatient((p) => ({
                                ...p,
                                [key]: !p[key],
                              }))
                            }
                            className={`w-10 h-5 rounded-full transition-all relative ${
                              patient[key]
                                ? "bg-[var(--accent-col)]"
                                : "bg-[var(--toggle-off)]"
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                                patient[key]
                                  ? "translate-x-5"
                                  : "translate-x-0.5"
                              }`}
                            />
                          </div>
                          <span className="text-sm text-[var(--text-body)]">{label}</span>
                        </label>
                      ))}

                      <div>
                        <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">
                          Conditions (comma separated)
                        </Label>
                        <Input
                          value={conditionInput}
                          onChange={(e) => setConditionInput(e.target.value)}
                          onBlur={() => {
                            const conds = conditionInput
                              .split(",")
                              .map((c) => c.trim())
                              .filter(Boolean);
                            setPatient((p) => ({ ...p, conditions: conds }));
                          }}
                          placeholder="e.g. atrial fibrillation, diabetes"
                          className="bg-[var(--section-bg)] border-[var(--border-col)] text-[var(--text-head)] placeholder:text-[var(--text-muted)] text-sm"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* API Key */}
            <div className="glass rounded-2xl p-6">
              <Label className="text-[var(--text-body)] text-sm mb-2 block">
                OpenAI API Key{" "}
                <span className="text-[var(--accent-col)] text-xs">(BYOK)</span>
              </Label>
              <div className="relative">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-…"
                  className="bg-[var(--section-bg)] border-[var(--border-col)] text-[var(--text-head)] placeholder:text-[var(--text-muted)] pr-10 font-mono text-sm"
                />
                <button
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-body)] transition-colors"
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                Your key flows through the request only — never stored, never logged
              </p>
            </div>

            {/* Submit / Reset */}
            {state === "idle" || state === "failed" ? (
              <Button
                onClick={state === "failed" ? reset : handleSubmit}
                disabled={state === "idle" && !canSubmit}
                className={`w-full py-6 text-base font-bold rounded-xl transition-all ${
                  state === "failed"
                    ? "bg-[var(--section-bg)] text-[var(--text-body)] border border-[var(--border-col)] hover:border-[var(--accent-col)]"
                    : "bg-[#22d3ee] hover:bg-[#06b6d4] text-[#060d1a] disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] glow-cyan"
                }`}
              >
                {state === "failed" ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Analyze Drug Interactions
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={reset}
                variant="outline"
                className="w-full py-6 text-base rounded-xl border-[var(--border-col)] text-[var(--text-muted)] hover:text-[var(--text-head)] hover:border-[var(--accent-col)]"
              >
                Cancel
              </Button>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </motion.div>

          {/* ── Right: Pipeline + Results ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3 space-y-6"
          >
            {/* Progress bar */}
            {(state === "polling" || state === "submitting") && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[var(--text-muted)]">
                  <span>Analysis in progress…</span>
                  <span>{progress}%</span>
                </div>
                <Progress
                  value={progress}
                  className="h-1.5 bg-[var(--section-bg)]"
                />
              </div>
            )}

            {/* Pipeline visualization */}
            {(state === "submitting" ||
              state === "polling" ||
              state === "complete") && (
              <PipelineViz stepStates={stepStates} jobId={jobId} />
            )}

            {/* Idle placeholder */}
            {state === "idle" && (
              <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-16 h-16 rounded-2xl bg-[#22d3ee]/10 border border-[#22d3ee]/20 flex items-center justify-center mb-5">
                  <Brain className="w-8 h-8 text-[var(--accent-col)]/60" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-head)] mb-2">
                  Ready to Analyze
                </h3>
                <p className="text-sm text-[var(--text-muted)] max-w-xs leading-relaxed">
                  Add your medications and OpenAI API key on the left, then
                  click{" "}
                  <span className="text-[var(--accent-col)]">
                    Analyze Drug Interactions
                  </span>{" "}
                  to start the pipeline.
                </p>
                <div className="mt-8 flex flex-col gap-2 w-full max-w-xs">
                  {[
                    "Try: warfarin, aspirin, ibuprofen",
                    "Try: metformin, lisinopril",
                    "Try: sertraline, tramadol, aspirin",
                  ].map((ex) => (
                    <button
                      key={ex}
                      onClick={() => {
                        const names = ex
                          .replace("Try: ", "")
                          .split(", ")
                          .map((d) => d.trim().toLowerCase());
                        setDrugs(names);
                      }}
                      className="text-xs py-2 px-3 rounded-lg border border-[var(--border-col)] text-[var(--text-muted)] hover:text-[var(--accent-col)] hover:border-[#22d3ee]/30 transition-all text-left"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {state === "complete" && result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-6"
              >
                <ResultsPanel result={result} jobId={jobId!} />
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}