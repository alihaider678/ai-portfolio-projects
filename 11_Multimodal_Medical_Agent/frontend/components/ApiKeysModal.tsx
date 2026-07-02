"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Eye, EyeOff, Mic, Volume2, CheckCircle2, X, Shield } from "lucide-react";
import { useApiKeys } from "@/context/ApiKeysContext";
import type { ApiKeys } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ApiKeysModal({ open, onClose }: Props) {
  const { keys, setKeys } = useApiKeys();
  const [form, setForm] = useState<ApiKeys>({ ...keys });
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showElevenLabs, setShowElevenLabs] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setKeys(form);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-lg glass-card rounded-2xl p-6 glow-cyan"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <Key className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--tx-heading)]">API Configuration</h2>
                  <p className="text-xs text-[var(--tx-4)]">Keys are used per-request only — never stored</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[var(--surf-3)] flex items-center justify-center text-[var(--tx-3)] hover:text-[var(--tx-heading)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Security badge */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 mb-6">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-400">BYOK Security — Keys travel only in request headers. Zero server-side storage.</p>
            </div>

            <div className="space-y-5">
              {/* OpenAI Key */}
              <div>
                <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
                  OpenAI API Key <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showOpenAI ? "text" : "password"}
                    value={form.openai_api_key}
                    onChange={e => setForm(f => ({ ...f, openai_api_key: e.target.value }))}
                    placeholder="sk-proj-..."
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-[var(--surf-2)] border border-[var(--bd-2)] text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 text-sm transition-all"
                  />
                  <button onClick={() => setShowOpenAI(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--tx-4)] hover:text-[var(--tx-2)] transition-colors">
                    {showOpenAI ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-[var(--tx-5)]">Used for GPT-4o Vision, Whisper, embeddings{form.tts_provider === "openai" ? ", and TTS" : ""}</p>
              </div>

              {/* TTS Provider Toggle */}
              <div>
                <label className="block text-sm font-medium text-[var(--tx-2)] mb-3">TTS Provider</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["openai", "elevenlabs"] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setForm(f => ({ ...f, tts_provider: p }))}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        form.tts_provider === p
                          ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-300"
                          : "border-[var(--bd-2)] bg-[var(--surf-1)] text-[var(--tx-3)] hover:border-[var(--bd-3)]"
                      }`}
                    >
                      {p === "openai" ? <Volume2 className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      <div className="text-left">
                        <div className="text-xs font-semibold capitalize">{p === "openai" ? "OpenAI TTS" : "ElevenLabs"}</div>
                        <div className="text-[10px] opacity-60">{p === "openai" ? "Fast & reliable" : "Studio quality"}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ElevenLabs Key (conditional) */}
              <AnimatePresence>
                {form.tts_provider === "elevenlabs" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div>
                      <label className="block text-sm font-medium text-[var(--tx-2)] mb-2">
                        ElevenLabs API Key <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showElevenLabs ? "text" : "password"}
                          value={form.elevenlabs_api_key}
                          onChange={e => setForm(f => ({ ...f, elevenlabs_api_key: e.target.value }))}
                          placeholder="sk_..."
                          className="w-full px-4 py-3 pr-12 rounded-xl bg-[var(--surf-2)] border border-[var(--bd-2)] text-[var(--tx-1)] placeholder-[var(--tx-5)] focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 text-sm transition-all"
                        />
                        <button onClick={() => setShowElevenLabs(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--tx-4)] hover:text-[var(--tx-2)] transition-colors">
                          {showElevenLabs ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Save Button */}
            <div className="mt-6 flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[var(--bd-2)] text-[var(--tx-3)] hover:border-[var(--bd-3)] hover:text-[var(--tx-2)] text-sm font-medium transition-all">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.openai_api_key}
                className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-[var(--surf-4)] disabled:text-[var(--tx-4)] text-slate-950 font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                {saved ? (
                  <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                ) : (
                  "Save Keys"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}