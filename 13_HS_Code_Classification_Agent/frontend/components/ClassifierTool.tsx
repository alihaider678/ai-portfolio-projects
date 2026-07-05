"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Loader2, AlertTriangle, Sparkles, ListOrdered, BadgePercent, Hash,
} from "lucide-react";
import { classify, type ClassifyResult, type Confidence } from "@/lib/api";

const SAMPLES = [
  "waterproof leather hiking boots, rubber sole",
  "men's cotton t-shirt",
  "fresh green apples",
  "lithium-ion battery for electric vehicles",
];

function ConfPill({ level }: { level: Confidence }) {
  const key = ["High", "Medium", "Low"].includes(level as string) ? level : "Medium";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold px-3 py-1.5 text-sm conf-${key}`}>
      <span className={`w-1.5 h-1.5 rounded-full dot-${key}`} /> {level} confidence
    </span>
  );
}

function Result({ r }: { r: ClassifyResult }) {
  const maxScore = Math.max(...r.candidates.map((c) => c.fusion_score), 0.0001);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
      {/* Primary result */}
      <div className="card rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-xs text-[var(--text-faint)] mb-1">Suggested HS / HTS code for &ldquo;{r.query}&rdquo;</div>
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5" style={{ color: "var(--accent)" }} />
              <span className="text-2xl font-extrabold tracking-tight text-[var(--text-strong)] font-mono">{r.suggested_hts_code}</span>
            </div>
            <div className="text-sm text-[var(--text-muted)] mt-1.5">{r.description}</div>
          </div>
          <ConfPill level={r.confidence} />
        </div>

        {/* Duty */}
        <div className="mt-4 flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--accent-soft)" }}>
          <BadgePercent className="w-5 h-5 shrink-0" style={{ color: "var(--accent)" }} />
          <div>
            <div className="text-xs text-[var(--text-faint)]">US general (MFN) duty rate</div>
            <div className="font-bold text-[var(--text-strong)]">{r.duty.duty_general || "—"}</div>
          </div>
        </div>
        {r.duty.note && <p className="text-xs text-[var(--text-faint)] mt-2">{r.duty.note}</p>}
      </div>

      {/* Justification */}
      {r.justification && (
        <div className="card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-[var(--text-strong)]">
            <Sparkles className="w-4 h-4" style={{ color: "var(--accent)" }} /> Why this code
          </div>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">{r.justification}</p>
        </div>
      )}

      {/* Candidates considered (RAG transparency) */}
      <div className="card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-[var(--text-strong)]">
          <ListOrdered className="w-4 h-4" style={{ color: "var(--accent)" }} /> Candidates considered (hybrid retrieval)
        </div>
        <div className="space-y-2">
          {r.candidates.map((c) => {
            const chosen = c.hts_code === r.suggested_hts_code;
            return (
              <div key={c.hts_code}
                className={`rounded-xl p-3 border ${chosen ? "border-[var(--accent)]" : ""}`}
                style={{ background: chosen ? "var(--accent-soft)" : "var(--surface)" }}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm font-semibold text-[var(--text-strong)]">{c.hts_code}</span>
                  <span className="text-xs text-[var(--text-faint)]">{c.duty_general || "—"}</span>
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-1 truncate">{c.description}</div>
                <div className="mt-2 h-1 rounded-full bar-track overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${(c.fusion_score / maxScore) * 100}%`,
                    background: "linear-gradient(90deg, var(--accent), var(--accent-2))",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export default function ClassifierTool() {
  const [product, setProduct] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ClassifyResult | null>(null);

  async function run(q?: string) {
    const query = (q ?? product).trim();
    if (!query) return;
    setProduct(query); setLoading(true); setError(""); setResult(null);
    try { setResult(await classify(query)); }
    catch (e) { setError(e instanceof Error ? e.message : "Classification failed"); }
    finally { setLoading(false); }
  }

  return (
    <section id="classify" className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-strong)]">Classify a product</h2>
        <p className="text-[var(--text-muted)] mt-2">Describe goods in plain English to get the HS/HTS code and US duty rate.</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)]" />
          <input value={product} onChange={(e) => setProduct(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="e.g. waterproof leather hiking boots, rubber sole"
            className="field w-full pl-10 pr-4 py-3 rounded-xl text-sm" />
        </div>
        <button onClick={() => run()} disabled={loading || !product.trim()}
          className="px-6 py-3 rounded-xl font-semibold text-white disabled:opacity-50 flex items-center gap-2"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
          {loading ? <Loader2 className="w-4 h-4 spin" /> : <Search className="w-4 h-4" />} Classify
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <span className="text-xs text-[var(--text-faint)] py-1">Try:</span>
        {SAMPLES.map((s) => (
          <button key={s} onClick={() => run(s)}
            className="text-xs px-2.5 py-1 rounded-lg border text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
            style={{ background: "var(--surface)" }}>{s}</button>
        ))}
      </div>

      {loading && (
        <div className="mt-6 text-center text-sm text-[var(--text-muted)] flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 spin" /> Retrieving candidates, fusing &amp; reranking…
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 text-sm text-rose-400 border border-rose-500/30 rounded-xl p-3"
          style={{ background: "rgba(239,68,68,.06)" }}>
          <AlertTriangle className="w-4 h-4" /> {error} — is the backend running on port 8011?
        </div>
      )}

      <AnimatePresence mode="wait">
        {result && !loading && <Result r={result} />}
      </AnimatePresence>
    </section>
  );
}