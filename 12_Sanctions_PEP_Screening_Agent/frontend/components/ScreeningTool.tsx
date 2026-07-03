"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Loader2, ShieldAlert, ShieldCheck, AlertTriangle, User, Building2,
  Users, ListChecks,
} from "lucide-react";
import {
  screen, batchScreen, type ScreenResult, type BatchResult,
  type EntityType, type Match, type RiskLevel,
} from "@/lib/api";

const SAMPLES = ["Rosoboronexport", "Vladmir Putin", "Kim Jong Un", "Acme Fresh Foods LLC"];

function RiskPill({ level, big = false }: { level: RiskLevel; big?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold risk-${level} ${
      big ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"}`}>
      <span className={`w-1.5 h-1.5 rounded-full dot-${level}`} />
      {level}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 92 ? "#ef4444" : score >= 82 ? "#f97316" : score >= 70 ? "#f59e0b" : "#10b981";
  return (
    <div className="flex items-center gap-2 w-28">
      <div className="flex-1 h-1.5 rounded-full bar-track overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[11px] text-[var(--text-faint)] tabular-nums">{score}%</span>
    </div>
  );
}

function MatchRow({ m }: { m: Match }) {
  const isSanction = m.list_type === "sanctions";
  return (
    <div className="card rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[var(--text-strong)]">{m.matched_name}</span>
            {m.is_alias && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-faint)]">alias</span>}
            {m.phonetic_match && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-faint)]">sounds-alike</span>}
          </div>
          {m.is_alias && (
            <div className="text-xs text-[var(--text-faint)] mt-0.5">primary: {m.primary_name}</div>
          )}
        </div>
        <RiskPill level={m.risk_level} />
      </div>

      <div className="flex items-center gap-3 flex-wrap text-xs mb-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${
          isSanction ? "text-rose-400 border-rose-500/40" : "text-amber-400 border-amber-500/40"}`}>
          {isSanction ? <ShieldAlert className="w-3 h-3" /> : <Users className="w-3 h-3" />}
          {isSanction ? "Sanctions" : "PEP"}
        </span>
        <span className="text-[var(--text-faint)]">{m.source}</span>
        <span className="text-[var(--text-faint)]">confidence: <span className="text-[var(--text-muted)]">{m.confidence}</span></span>
        <ScoreBar score={m.score} />
      </div>

      {m.programs.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {m.programs.slice(0, 4).map((p, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--text-muted)]">{p}</span>
          ))}
        </div>
      )}
      <p className="text-xs text-[var(--text-muted)] leading-relaxed">{m.explanation}</p>
    </div>
  );
}

function SingleResult({ result }: { result: ScreenResult }) {
  const clear = result.overall_risk === "LOW" && result.match_count === 0;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
      <div className="card rounded-2xl p-5 flex items-center justify-between">
        <div>
          <div className="text-xs text-[var(--text-faint)] mb-1">Screening result for</div>
          <div className="font-semibold text-[var(--text-strong)]">&ldquo;{result.query}&rdquo;</div>
        </div>
        <div className="text-right">
          {clear ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-5 h-5" /> No matches — clear
            </span>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <RiskPill level={result.overall_risk} big />
              <span className="text-xs text-[var(--text-faint)]">{result.match_count} potential match{result.match_count !== 1 ? "es" : ""}</span>
            </div>
          )}
        </div>
      </div>
      {result.matches.map((m) => <MatchRow key={m.entity_id} m={m} />)}
    </motion.div>
  );
}

function BatchResults({ data }: { data: BatchResult }) {
  const order: RiskLevel[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {order.map((lvl) => (
          <div key={lvl} className={`rounded-xl border p-3 text-center risk-${lvl}`}>
            <div className="text-xl font-bold">{data.risk_summary[lvl] ?? 0}</div>
            <div className="text-[10px] font-medium opacity-80">{lvl}</div>
          </div>
        ))}
      </div>
      {data.results.filter(r => r.overall_risk !== "LOW").map((r, i) => (
        <div key={i} className="card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-[var(--text-strong)]">{r.query}</span>
            <RiskPill level={r.overall_risk} />
          </div>
          {r.matches[0] && <p className="text-xs text-[var(--text-faint)] mt-1">{r.matches[0].explanation}</p>}
        </div>
      ))}
      {data.results.every(r => r.overall_risk === "LOW") && (
        <div className="card rounded-xl p-4 text-emerald-400 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> All names cleared — no sanctions or PEP matches.
        </div>
      )}
    </motion.div>
  );
}

export default function ScreeningTool() {
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [entityType, setEntityType] = useState<EntityType>("any");
  const [name, setName] = useState("");
  const [names, setNames] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [single, setSingle] = useState<ScreenResult | null>(null);
  const [batch, setBatch] = useState<BatchResult | null>(null);

  async function runSingle(q?: string) {
    const query = (q ?? name).trim();
    if (!query) return;
    setName(query); setLoading(true); setError(""); setSingle(null);
    try { setSingle(await screen(query, entityType)); }
    catch (e) { setError(e instanceof Error ? e.message : "Screening failed"); }
    finally { setLoading(false); }
  }

  async function runBatch() {
    const list = names.split("\n").map(s => s.trim()).filter(Boolean);
    if (!list.length) return;
    setLoading(true); setError(""); setBatch(null);
    try { setBatch(await batchScreen(list, entityType)); }
    catch (e) { setError(e instanceof Error ? e.message : "Screening failed"); }
    finally { setLoading(false); }
  }

  return (
    <section id="screen" className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-strong)]">Live Screening</h2>
        <p className="text-[var(--text-muted)] mt-2">Enter a company or individual to screen against sanctions &amp; PEP lists.</p>
      </div>

      {/* Mode + entity type */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="inline-flex rounded-lg border p-1" style={{ background: "var(--surface)" }}>
          {(["single", "batch"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 ${
                mode === m ? "text-white" : "text-[var(--text-muted)]"}`}
              style={mode === m ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))" } : {}}>
              {m === "single" ? <Search className="w-3.5 h-3.5" /> : <ListChecks className="w-3.5 h-3.5" />}
              {m === "single" ? "Single" : "Batch"}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-lg border p-1" style={{ background: "var(--surface)" }}>
          {([["any", null], ["person", User], ["organization", Building2]] as const).map(([t, Icon]) => (
            <button key={t} onClick={() => setEntityType(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize flex items-center gap-1 ${
                entityType === t ? "text-[var(--text-strong)] bg-[var(--surface-2)]" : "text-[var(--text-faint)]"}`}>
              {Icon && <Icon className="w-3 h-3" />}{t}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      {mode === "single" ? (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)]" />
              <input value={name} onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSingle()}
                placeholder="e.g. Rosoboronexport"
                className="field w-full pl-10 pr-4 py-3 rounded-xl text-sm" />
            </div>
            <button onClick={() => runSingle()} disabled={loading || !name.trim()}
              className="px-6 py-3 rounded-xl font-semibold text-white disabled:opacity-50 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
              {loading ? <Loader2 className="w-4 h-4 spin" /> : <Search className="w-4 h-4" />} Screen
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-[var(--text-faint)] py-1">Try:</span>
            {SAMPLES.map((s) => (
              <button key={s} onClick={() => runSingle(s)}
                className="text-xs px-2.5 py-1 rounded-lg border text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
                style={{ background: "var(--surface)" }}>{s}</button>
            ))}
          </div>
        </>
      ) : (
        <>
          <textarea value={names} onChange={(e) => setNames(e.target.value)} rows={5}
            placeholder={"One name per line, e.g.\nRosoboronexport\nAcme Fresh Foods LLC\nKim Jong Un"}
            className="field w-full px-4 py-3 rounded-xl text-sm resize-y" />
          <button onClick={runBatch} disabled={loading || !names.trim()}
            className="mt-3 px-6 py-3 rounded-xl font-semibold text-white disabled:opacity-50 flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
            {loading ? <Loader2 className="w-4 h-4 spin" /> : <ListChecks className="w-4 h-4" />} Screen all
          </button>
        </>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 text-sm text-rose-400 border border-rose-500/30 rounded-xl p-3"
          style={{ background: "rgba(239,68,68,.06)" }}>
          <AlertTriangle className="w-4 h-4" /> {error} — is the backend running on port 8010?
        </div>
      )}

      <AnimatePresence mode="wait">
        {mode === "single" && single && <SingleResult result={single} />}
        {mode === "batch" && batch && <BatchResults data={batch} />}
      </AnimatePresence>
    </section>
  );
}