"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Brain, CheckCircle2, AlertTriangle, BookOpen, Images, Layers } from "lucide-react";
import { useApiKeys } from "@/context/ApiKeysContext";
import { ingestPDF, listDocuments } from "@/lib/api";

interface IngestResult {
  doc_name: string;
  pages_ingested: number;
  images_found: number;
  total_chunks: number;
}

export default function KnowledgeIngestTab() {
  const { keys, hasOpenAIKey } = useApiKeys();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<"idle" | "ingesting" | "done" | "error">("idle");
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState("");
  const [docs, setDocs] = useState<string[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!hasOpenAIKey) return;
    setLoadingDocs(true);
    listDocuments(keys.openai_api_key).then(d => { setDocs(d); setLoadingDocs(false); });
  }, [hasOpenAIKey, keys.openai_api_key]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") { setFile(f); setError(""); }
    else setError("Please drop a PDF file");
  }, []);

  async function handleIngest() {
    if (!file || !hasOpenAIKey) return;
    try {
      setPhase("ingesting");
      setProgress(0);
      const tick = setInterval(() => setProgress(p => Math.min(p + 4, 90)), 600);
      const r = await ingestPDF(file, keys.openai_api_key);
      clearInterval(tick);
      setProgress(100);
      setResult(r);
      setPhase("done");
      // Refresh doc list
      listDocuments(keys.openai_api_key).then(setDocs);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ingest failed");
      setPhase("error");
    }
  }

  function reset() {
    setPhase("idle"); setFile(null); setResult(null); setError(""); setProgress(0);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Upload */}
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-semibold text-[var(--tx-heading)] mb-1">Upload Medical PDF</h3>
          <p className="text-sm text-[var(--tx-4)]">Procedure guides, drug references, clinical protocols with embedded diagrams</p>
        </div>

        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                className={`upload-zone rounded-2xl p-10 text-center cursor-pointer flex flex-col items-center gap-4 ${dragOver ? "drag-over" : ""}`}
              >
                <div className="w-14 h-14 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  {file ? <FileText className="w-7 h-7 text-violet-400" /> : <Upload className="w-7 h-7 text-violet-400" />}
                </div>
                {file ? (
                  <>
                    <p className="text-[var(--tx-heading)] font-semibold">{file.name}</p>
                    <p className="text-[var(--tx-4)] text-sm">{(file.size / 1024).toFixed(0)} KB · PDF ready</p>
                  </>
                ) : (
                  <>
                    <p className="text-[var(--tx-heading)] font-semibold">Drop PDF here</p>
                    <p className="text-[var(--tx-4)] text-sm">Medical procedures, drug references, clinical guides</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) { setFile(e.target.files[0]); setError(""); } }} />
              </div>
            </motion.div>
          )}

          {phase === "ingesting" && (
            <motion.div key="ingesting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-violet-500/20 bg-[var(--surf-1)] p-10 flex flex-col items-center gap-5">
              <div className="relative w-20 h-20">
                <div className="w-20 h-20 rounded-full border-2 border-violet-500/20" />
                <div className="absolute inset-0 rounded-full border-t-2 border-violet-400 animate-spin" />
                <div className="absolute inset-4 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-violet-400" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-[var(--tx-heading)] font-semibold">Processing PDF…</p>
                <p className="text-[var(--tx-4)] text-sm mt-1">Extracting text, describing images with GPT-4o Vision, indexing in ChromaDB</p>
              </div>
              <div className="w-full bg-[var(--surf-3)] rounded-full h-2">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-violet-400 text-sm font-medium">{progress}%</p>
            </motion.div>
          )}

          {phase === "done" && result && (
            <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 border-emerald-500/20">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[var(--tx-heading)] font-semibold">Ingestion Complete</p>
                  <p className="text-[var(--tx-4)] text-xs truncate max-w-48">{result.doc_name}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: BookOpen, label: "Pages", value: result.pages_ingested, color: "text-cyan-400" },
                  { icon: Images, label: "Images", value: result.images_found, color: "text-violet-400" },
                  { icon: Layers, label: "Chunks", value: result.total_chunks, color: "text-emerald-400" },
                ].map(stat => (
                  <div key={stat.label} className="text-center p-3 rounded-xl bg-[var(--surf-1)] border border-[var(--bd-1)]">
                    <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[var(--tx-5)] text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>
              <button onClick={reset} className="mt-4 text-sm text-[var(--tx-4)] hover:text-[var(--tx-2)] transition-colors">Upload another PDF</button>
            </motion.div>
          )}

          {phase === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
              <AlertTriangle className="w-7 h-7 text-rose-400 mx-auto mb-3" />
              <p className="text-rose-300 font-semibold mb-1">Ingest Failed</p>
              <p className="text-[var(--tx-4)] text-sm mb-4">{error}</p>
              <button onClick={reset} className="px-4 py-2 rounded-xl border border-[var(--bd-2)] text-[var(--tx-3)] hover:text-[var(--tx-heading)] text-sm transition-colors">Try Again</button>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === "idle" && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleIngest}
              disabled={!file || !hasOpenAIKey || phase !== "idle"}
              className="px-7 py-3.5 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:bg-[var(--surf-3)] disabled:text-[var(--tx-5)] text-white font-bold transition-all"
            >
              Ingest PDF
            </button>
            {!hasOpenAIKey && (
              <p className="text-sm text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Set your OpenAI key first
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right: Knowledge base */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[var(--tx-heading)]">Knowledge Base</h3>
          <span className="text-xs text-[var(--tx-4)] bg-[var(--surf-1)] border border-[var(--bd-1)] px-2.5 py-1 rounded-full">
            {docs.length} document{docs.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="glass-card rounded-2xl p-4 min-h-64">
          {!hasOpenAIKey ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <Brain className="w-8 h-8 text-[var(--tx-6)]" />
              <p className="text-[var(--tx-5)] text-sm">Set your OpenAI key to view indexed documents</p>
            </div>
          ) : loadingDocs ? (
            <div className="flex flex-col items-center justify-center h-48">
              <div className="w-6 h-6 rounded-full border-t-2 border-violet-400 animate-spin" />
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <BookOpen className="w-8 h-8 text-[var(--tx-6)]" />
              <p className="text-[var(--tx-5)] text-sm">No documents ingested yet</p>
              <p className="text-[var(--tx-6)] text-xs">Upload a PDF to populate the knowledge base</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map(doc => (
                <motion.div
                  key={doc}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surf-1)] border border-[var(--bd-1)] hover:border-violet-500/20 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--tx-1)] text-sm font-medium truncate">{doc.replace(/_/g, " ").replace(".pdf", "")}</p>
                    <p className="text-[var(--tx-5)] text-xs">{doc}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 opacity-60" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-[var(--tx-5)] mt-3">
          3 sample documents are pre-loaded: insulin injection procedure, blood pressure measurement, wound dressing change.
        </p>
      </div>
    </div>
  );
}