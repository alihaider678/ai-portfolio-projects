"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Mic2, Play, Pause, AlertTriangle, BookOpen, Image as ImageIcon, RotateCcw } from "lucide-react";
import { useApiKeys } from "@/context/ApiKeysContext";
import { queryKnowledge, base64ToAudioUrl } from "@/lib/api";

interface Hit {
  doc_name: string;
  page: number;
  text: string;
  image_b64: string;
  image_descriptions: string;
  distance: number;
}

interface QueryResult {
  results: Hit[];
  spoken_response: string;
  audio_url: string;
}

const SAMPLE_QUERIES = [
  "How do I inject insulin correctly?",
  "What are the steps for measuring blood pressure?",
  "How to change a wound dressing?",
  "What angle should the needle be at?",
];

function AudioPlayer({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLAudioElement>(null);
  function toggle() {
    if (!ref.current) return;
    playing ? ref.current.pause() : ref.current.play();
    setPlaying(p => !p);
  }
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--surf-1)] border border-emerald-500/20">
      <button onClick={toggle} className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-400 transition-colors shrink-0">
        {playing ? <Pause className="w-4 h-4 text-slate-950" /> : <Play className="w-4 h-4 text-slate-950 ml-0.5" />}
      </button>
      <div className="flex-1">
        <p className="text-xs text-[var(--tx-3)] mb-1">Spoken medical answer</p>
        {playing ? (
          <div className="flex items-end gap-0.5 h-6">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-1 rounded-full bg-emerald-400 wave-bar" style={{ animationDelay: `${i * 0.05}s`, height: "4px" }} />
            ))}
          </div>
        ) : (
          <div className="h-1.5 bg-[var(--surf-3)] rounded-full" />
        )}
      </div>
      <a href={url} download="answer.mp3" className="text-xs text-[var(--tx-4)] hover:text-[var(--tx-2)]">Download</a>
      <audio ref={ref} src={url} onEnded={() => setPlaying(false)} />
    </div>
  );
}

function ScoreBar({ distance }: { distance: number }) {
  const relevance = Math.max(0, Math.min(100, (1 - distance) * 100));
  const color = relevance > 70 ? "bg-emerald-500" : relevance > 40 ? "bg-amber-500" : "bg-[var(--surf-5)]";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-[var(--surf-3)] rounded-full">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${relevance}%` }} />
      </div>
      <span className="text-[10px] text-[var(--tx-4)] shrink-0">{relevance.toFixed(0)}%</span>
    </div>
  );
}

export default function KnowledgeQueryTab() {
  const { keys, hasOpenAIKey } = useApiKeys();
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<"idle" | "searching" | "done" | "error">("idle");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState("");
  const [topK, setTopK] = useState(3);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  async function handleQuery() {
    if (!query.trim() || !hasOpenAIKey) return;
    try {
      setPhase("searching");
      const r = await queryKnowledge(query.trim(), keys, topK);
      setResult({ ...r, audio_url: base64ToAudioUrl(r.audio_b64) });
      setPhase("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Query failed");
      setPhase("error");
    }
  }

  function reset() {
    setPhase("idle"); setResult(null); setError("");
  }

  return (
    <div className="space-y-6">
      {/* Query Input */}
      <div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--tx-3)] mb-2">Your Medical Question</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--tx-5)]" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleQuery()}
                placeholder="e.g. How do I inject insulin correctly?"
                className="w-full pl-11 pr-4 py-4 rounded-xl bg-[var(--surf-2)] border border-[var(--bd-2)] text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 text-sm transition-all"
                disabled={phase === "searching"}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--tx-3)] mb-2">Top K</label>
            <select
              value={topK}
              onChange={e => setTopK(Number(e.target.value))}
              className="px-4 py-4 rounded-xl bg-[var(--surf-2)] border border-[var(--bd-2)] text-[var(--tx-2)] focus:outline-none focus:border-emerald-500/60 text-sm"
            >
              {[1, 2, 3, 5].map(n => <option key={n} value={n}>{n} result{n > 1 ? "s" : ""}</option>)}
            </select>
          </div>
        </div>

        {/* Sample queries */}
        <div className="flex flex-wrap gap-2 mt-3">
          {SAMPLE_QUERIES.map(q => (
            <button
              key={q}
              onClick={() => setQuery(q)}
              className="text-xs text-[var(--tx-4)] hover:text-[var(--tx-2)] border border-[var(--bd-1)] hover:border-[var(--bd-2)] px-3 py-1.5 rounded-lg transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleQuery}
          disabled={!query.trim() || !hasOpenAIKey || phase === "searching"}
          className="px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-[var(--surf-3)] disabled:text-[var(--tx-5)] text-slate-950 font-bold transition-all flex items-center gap-2"
        >
          <Mic2 className="w-4 h-4" />
          {phase === "searching" ? "Searching…" : "Ask Knowledge Base"}
        </button>
        {!hasOpenAIKey && (
          <p className="text-sm text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Set your OpenAI key first
          </p>
        )}
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {phase === "searching" && (
          <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-emerald-500/20 bg-[var(--surf-1)] p-10 flex flex-col items-center gap-5">
            <div className="relative w-20 h-20">
              <div className="w-20 h-20 rounded-full border-2 border-emerald-500/20" />
              <div className="absolute inset-0 rounded-full border-t-2 border-emerald-400 animate-spin" />
              <div className="absolute inset-4 flex items-center justify-center">
                <Search className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-[var(--tx-heading)] font-semibold">Searching knowledge base…</p>
              <p className="text-[var(--tx-4)] text-sm mt-1">Vector retrieval → image+text pairing → generating spoken response</p>
            </div>
          </motion.div>
        )}

        {phase === "done" && result && (
          <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Audio response */}
            <AudioPlayer url={result.audio_url} />

            {/* Spoken text */}
            <div className="glass-card rounded-2xl p-5">
              <p className="text-xs font-semibold text-[var(--tx-4)] uppercase tracking-widest mb-3">Spoken Response Text</p>
              <p className="text-[var(--tx-2)] text-sm leading-relaxed">{result.spoken_response}</p>
            </div>

            {/* Retrieved chunks */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-[var(--tx-4)]" />
                <p className="text-sm font-semibold text-[var(--tx-heading)]">Retrieved Knowledge Chunks</p>
                <span className="text-xs text-[var(--tx-5)]">{result.results.length} matched</span>
              </div>
              <div className="space-y-4">
                {result.results.map((hit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="glass-card rounded-2xl overflow-hidden"
                  >
                    {/* Chunk header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--bd-1)]">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-xs text-emerald-400 font-bold">
                          {i + 1}
                        </span>
                        <span className="text-sm text-[var(--tx-heading)] font-medium">{hit.doc_name.replace(/_/g, " ")}</span>
                        <span className="text-xs text-[var(--tx-5)]">· Page {hit.page}</span>
                      </div>
                      <div className="w-24">
                        <ScoreBar distance={hit.distance} />
                      </div>
                    </div>

                    <div className={`p-5 grid gap-4 ${hit.image_b64 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                      {/* Text */}
                      <div>
                        <p className="text-xs text-[var(--tx-5)] uppercase tracking-widest mb-2">Procedure Text</p>
                        <p className="text-[var(--tx-2)] text-sm leading-relaxed line-clamp-6">{hit.text}</p>
                        {hit.image_descriptions && (
                          <p className="text-[var(--tx-4)] text-xs mt-2 italic">
                            Image: {hit.image_descriptions.split("|")[0]?.trim()}
                          </p>
                        )}
                      </div>

                      {/* Image */}
                      {hit.image_b64 && (
                        <div>
                          <p className="text-xs text-[var(--tx-5)] uppercase tracking-widest mb-2 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> Diagram
                          </p>
                          <div
                            className="rounded-xl overflow-hidden border border-[var(--bd-1)] cursor-pointer hover:border-emerald-500/30 transition-all"
                            onClick={() => setExpandedImage(`data:image/png;base64,${hit.image_b64}`)}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`data:image/png;base64,${hit.image_b64}`}
                              alt="Medical diagram"
                              className="w-full h-48 object-contain bg-[var(--surf-0)]"
                            />
                          </div>
                          <p className="text-xs text-[var(--tx-6)] mt-1 text-center">Click to enlarge</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <button onClick={reset} className="flex items-center gap-2 text-[var(--tx-4)] hover:text-[var(--tx-2)] text-sm transition-colors">
              <RotateCcw className="w-4 h-4" /> Ask another question
            </button>
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
            <AlertTriangle className="w-7 h-7 text-rose-400 mx-auto mb-3" />
            <p className="text-rose-300 font-semibold mb-1">Query Failed</p>
            <p className="text-[var(--tx-4)] text-sm mb-4">{error}</p>
            <button onClick={reset} className="px-4 py-2 rounded-xl border border-[var(--bd-2)] text-[var(--tx-3)] hover:text-[var(--tx-heading)] text-sm transition-colors">Try Again</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {expandedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85" onClick={() => setExpandedImage(null)}>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              src={expandedImage}
              alt="Medical diagram enlarged"
              className="max-w-2xl max-h-[80vh] object-contain rounded-2xl border border-[var(--bd-2)]"
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}