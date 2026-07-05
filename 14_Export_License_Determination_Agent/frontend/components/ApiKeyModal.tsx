"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, X, ShieldCheck, ExternalLink, Trash2 } from "lucide-react";
import { useApiKey } from "./ApiKeyProvider";

export default function ApiKeyModal() {
  const { apiKey, setApiKey, dialogOpen, setDialogOpen } = useApiKey();
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (dialogOpen) setDraft(apiKey);
  }, [dialogOpen, apiKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDialogOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setDialogOpen]);

  return (
    <AnimatePresence>
      {dialogOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDialogOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="relative card-solid glow rounded-2xl w-full max-w-md p-6">
            <button onClick={() => setDialogOpen(false)}
              className="absolute right-4 top-4 text-[var(--text-faint)] hover:text-[var(--text-strong)]">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl grad-bg flex items-center justify-center">
                <KeyRound className="w-4.5 h-4.5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-strong)]">Use your own OpenAI key</h3>
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
              <strong className="text-[var(--text)]">Optional.</strong> The demo already works on a shared key.
              Paste your own to run the LLM parsing &amp; classification on your account instead.
            </p>

            <label className="block text-xs font-semibold text-[var(--text-muted)] mt-5 mb-1.5">
              OpenAI API key
            </label>
            <input
              type="password" value={draft} onChange={(e) => setDraft(e.target.value)}
              placeholder="sk-..." autoComplete="off"
              className="field w-full px-3.5 py-2.5 rounded-xl text-sm font-mono" />

            <div className="mt-3 flex items-start gap-2 text-xs text-[var(--text-faint)]">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--ok)" }} />
              <span>
                Stored only in your browser (localStorage) and sent directly to the backend for
                your request. Never logged or persisted server-side.
              </span>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button onClick={() => { setApiKey(draft.trim()); setDialogOpen(false); }}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white grad-bg disabled:opacity-50">
                Save key
              </button>
              {apiKey && (
                <button onClick={() => { setApiKey(""); setDraft(""); }}
                  className="px-3.5 py-2.5 rounded-xl border text-[var(--text-muted)] hover:text-[var(--stop)] hover:border-[var(--stop-bd)] flex items-center gap-1.5"
                  title="Remove saved key">
                  <Trash2 className="w-4 h-4" /> Clear
                </button>
              )}
            </div>

            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline">
              Get a key from OpenAI <ExternalLink className="w-3 h-3" />
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}