"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Mic, MicOff, ImageIcon, AlertTriangle,
  CheckCircle2, Play, Pause, RotateCcw, Pill, Square
} from "lucide-react";
import { useApiKeys } from "@/context/ApiKeysContext";
import { analyzePrescription, pollPrescriptionJob, base64ToAudioUrl } from "@/lib/api";

type Phase = "idle" | "uploading" | "processing" | "done" | "error";

interface Interaction {
  drug1?: string;
  drug2?: string;
  drug_a?: string;
  drug_b?: string;
  drugs?: string[];
  drug_pair?: string;
  pair?: string;
  severity?: string;
  description?: string;
  summary?: string;
  mechanism?: string;
  explanation?: string;
}

interface Result {
  medications: string[];
  interaction_result: {
    overall_risk?: string;
    overall_risk_level?: string;
    severity?: string;
    pair_results?: Interaction[];
    interactions?: Interaction[];
    drug_interactions?: Interaction[];
  };
  summary_text: string;
  audio_url: string;
}

function SeverityBadge({ level }: { level: string }) {
  const cls = level.toLowerCase().includes("high") || level.toLowerCase().includes("critical")
    ? "severity-high" : level.toLowerCase().includes("moderate")
    ? "severity-moderate" : "severity-low";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      {level}
    </span>
  );
}

function WaveformAnim() {
  return (
    <div className="flex items-end gap-1 h-10">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-rose-400 wave-bar"
          style={{ animationDelay: `${i * 0.08}s`, height: "8px" }}
        />
      ))}
    </div>
  );
}

function AudioPlayer({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLAudioElement>(null);
  function toggle() {
    if (!ref.current) return;
    playing ? ref.current.pause() : ref.current.play();
    setPlaying(p => !p);
  }
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--surf-1)] border border-cyan-500/20">
      <button onClick={toggle} className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center hover:bg-cyan-400 transition-colors">
        {playing ? <Pause className="w-5 h-5 text-slate-950" /> : <Play className="w-5 h-5 text-slate-950 ml-0.5" />}
      </button>
      <div className="flex-1">
        <p className="text-xs text-[var(--tx-3)] mb-1">Spoken interaction report</p>
        {playing ? (
          <div className="flex items-end gap-0.5 h-6">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-1 rounded-full bg-cyan-400 wave-bar" style={{ animationDelay: `${i * 0.05}s`, height: "4px" }} />
            ))}
          </div>
        ) : (
          <div className="h-1.5 bg-[var(--surf-3)] rounded-full">
            <div className="h-full w-0 bg-cyan-500 rounded-full" />
          </div>
        )}
      </div>
      <a href={url} download="interaction_report.mp3" className="text-xs text-[var(--tx-4)] hover:text-[var(--tx-2)] transition-colors">Download</a>
      <audio ref={ref} src={url} onEnded={() => setPlaying(false)} />
    </div>
  );
}

export default function PrescriptionTab() {
  const { keys, hasOpenAIKey } = useApiKeys();
  const [phase, setPhase] = useState<Phase>("idle");
  const [inputMode, setInputMode] = useState<"image" | "audio">("image");
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Recording — kept separate from phase to avoid TS narrowing conflict
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = () => {
    setPhase("idle");
    setFile(null);
    setResult(null);
    setError("");
    setRecordSecs(0);
    setIsRecording(false);
  };

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = e => chunksRef.current.push(e.data);
    mr.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setFile(new File([blob], "recording.webm", { type: "audio/webm" }));
      setIsRecording(false);
    };
    mr.start();
    mediaRef.current = mr;
    setIsRecording(true);
    setRecordSecs(0);
    timerRef.current = setInterval(() => setRecordSecs(s => s + 1), 1000);
  }

  function stopRecording() {
    mediaRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setError(""); }
  }, []);

  async function handleAnalyze() {
    if (!file || !hasOpenAIKey) return;
    try {
      setPhase("uploading");
      const jobId = await analyzePrescription(file, inputMode, keys);
      setPhase("processing");
      for (let i = 0; i < 120; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const job = await pollPrescriptionJob(jobId);
        if ((job.status === "complete" || job.status === "completed") && job.result) {
          const r = job.result;
          const medNames =
            r.drug_names && r.drug_names.length > 0
              ? r.drug_names
              : (r.medications ?? []).map(m => m.name).filter((n): n is string => !!n);
          setResult({
            medications: medNames,
            interaction_result: r.interaction_result as Result["interaction_result"],
            summary_text: r.summary_text,
            audio_url: base64ToAudioUrl(r.audio_b64),
          });
          setPhase("done");
          return;
        }
        if (job.status === "failed") throw new Error(job.error ?? "Job failed");
      }
      throw new Error("Timeout: analysis took too long");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setPhase("error");
    }
  }

  const ix = result?.interaction_result ?? {};
  const severity = ix.overall_risk ?? ix.overall_risk_level ?? ix.severity ?? "";
  const interactionList = ix.pair_results ?? ix.interactions ?? ix.drug_interactions ?? [];

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex rounded-xl border border-[var(--bd-1)] bg-[var(--surf-1)] p-1 w-fit">
        {(["image", "audio"] as const).map(m => (
          <button
            key={m}
            onClick={() => { setInputMode(m); reset(); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              inputMode === m ? "tab-active text-cyan-300" : "text-[var(--tx-4)] hover:text-[var(--tx-2)]"
            }`}
          >
            {m === "image" ? <ImageIcon className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {m === "image" ? "Photo / Scan" : "Voice Recording"}
          </button>
        ))}
      </div>

      {/* Upload / Record area */}
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {inputMode === "image" ? (
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                className={`upload-zone rounded-2xl p-12 text-center cursor-pointer flex flex-col items-center gap-4 ${dragOver ? "drag-over" : ""}`}
              >
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  {file ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <Upload className="w-8 h-8 text-cyan-400" />}
                </div>
                {file ? (
                  <>
                    <p className="text-[var(--tx-heading)] font-semibold">{file.name}</p>
                    <p className="text-[var(--tx-4)] text-sm">{(file.size / 1024).toFixed(1)} KB · Click to replace</p>
                  </>
                ) : (
                  <>
                    <p className="text-[var(--tx-heading)] font-semibold">Drop prescription image here</p>
                    <p className="text-[var(--tx-4)] text-sm">PNG, JPG, HEIC — handwritten or printed</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) { setFile(e.target.files[0]); setError(""); } }} />
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--bd-1)] bg-[var(--surf-1)] p-12 flex flex-col items-center gap-6">
                {file ? (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--surf-1)] border border-emerald-500/20 w-full max-w-sm">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <div>
                      <p className="text-[var(--tx-heading)] text-sm font-medium">Recording ready</p>
                      <p className="text-[var(--tx-4)] text-xs">{recordSecs}s captured</p>
                    </div>
                    <button onClick={reset} className="ml-auto text-[var(--tx-4)] hover:text-[var(--tx-2)]"><RotateCcw className="w-4 h-4" /></button>
                  </div>
                ) : isRecording ? (
                  <>
                    <WaveformAnim />
                    <p className="text-rose-400 font-semibold text-lg">{recordSecs}s</p>
                    <button onClick={stopRecording} className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-400 flex items-center justify-center transition-all shadow-lg shadow-rose-500/30">
                      <Square className="w-6 h-6 text-white" />
                    </button>
                    <p className="text-[var(--tx-4)] text-sm">Recording… tap to stop</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                      <Mic className="w-8 h-8 text-rose-400" />
                    </div>
                    <button onClick={startRecording} className="px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold transition-all flex items-center gap-2">
                      <MicOff className="w-4 h-4" /> Start Recording
                    </button>
                    <p className="text-[var(--tx-4)] text-sm">Read out drug names, dosages, instructions</p>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}

        {(phase === "uploading" || phase === "processing") && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-cyan-500/20 bg-[var(--surf-1)] p-12 flex flex-col items-center gap-6">
            <div className="relative w-20 h-20">
              <div className="w-20 h-20 rounded-full border-2 border-cyan-500/20" />
              <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" />
              <div className="absolute inset-4 flex items-center justify-center">
                <Pill className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-[var(--tx-heading)] font-semibold">
                {phase === "uploading" ? "Uploading file…" : "AI Analysis in progress…"}
              </p>
              <p className="text-[var(--tx-4)] text-sm mt-1">
                {phase === "processing" ? "GPT-4o reading prescription · Checking drug interactions · Generating audio" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              {["Vision", "Drug Check", "TTS"].map((s, i) => (
                <div key={s} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs ${phase === "processing" && i < 2 ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10" : "border-[var(--bd-2)] text-[var(--tx-5)]"}`}>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {phase === "done" && result && (
          <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Medications */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Pill className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-[var(--tx-heading)]">Medications Detected</h3>
                <span className="ml-auto text-xs text-[var(--tx-4)]">{result.medications.length} found</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.medications.map(med => (
                  <span key={med} className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-sm font-medium">{med}</span>
                ))}
              </div>
            </div>

            {/* Interactions */}
            <div className={`glass-card rounded-2xl p-5 ${severity.toLowerCase().includes("high") ? "border-rose-500/30" : severity.toLowerCase().includes("moderate") ? "border-amber-500/30" : "border-emerald-500/20"}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-[var(--tx-heading)]">Drug Interactions</h3>
                </div>
                {severity && <SeverityBadge level={severity} />}
              </div>
              {interactionList.length > 0 ? (
                <div className="space-y-3">
                  {interactionList.map((item, i) => {
                    const a = item.drug1 ?? item.drug_a;
                    const b = item.drug2 ?? item.drug_b;
                    const pairLabel =
                      a && b ? `${a} + ${b}`
                      : item.drug_pair ?? item.pair
                      ?? (item.drugs && item.drugs.length ? item.drugs.join(" + ") : "Interaction");
                    const detail = item.description ?? item.summary ?? item.mechanism ?? item.explanation;
                    return (
                    <div key={i} className="p-3 rounded-xl bg-[var(--surf-1)] border border-[var(--bd-1)]">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-[var(--tx-heading)] font-medium">{pairLabel}</p>
                        {item.severity && <SeverityBadge level={item.severity} />}
                      </div>
                      {detail && <p className="text-xs text-[var(--tx-3)]">{detail}</p>}
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <p className="text-sm">No significant interactions detected</p>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="glass-card rounded-2xl p-5">
              <p className="text-xs font-semibold text-[var(--tx-4)] uppercase tracking-widest mb-3">Clinical Summary</p>
              <p className="text-[var(--tx-2)] text-sm leading-relaxed">{result.summary_text}</p>
            </div>

            <AudioPlayer url={result.audio_url} />

            <button onClick={reset} className="flex items-center gap-2 text-[var(--tx-4)] hover:text-[var(--tx-2)] text-sm transition-colors">
              <RotateCcw className="w-4 h-4" /> Analyze another prescription
            </button>
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
            <p className="text-rose-300 font-semibold mb-1">Analysis Failed</p>
            <p className="text-[var(--tx-4)] text-sm mb-4">{error}</p>
            <button onClick={reset} className="px-4 py-2 rounded-xl border border-[var(--bd-2)] text-[var(--tx-3)] hover:text-[var(--tx-heading)] text-sm transition-colors">Try Again</button>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "idle" && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={!file || !hasOpenAIKey || isRecording}
            className="px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-[var(--surf-3)] disabled:text-[var(--tx-5)] text-slate-950 font-bold transition-all glow-cyan disabled:shadow-none"
          >
            Analyze Prescription
          </button>
          {!hasOpenAIKey && (
            <p className="text-sm text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Set your OpenAI key first
            </p>
          )}
        </div>
      )}
    </div>
  );
}