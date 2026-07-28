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
            initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="relative panel-solid glow w-full max-w-md p-7">
            <button onClick={() => setDialogOpen(false)}
              className="absolute right-5 top-5 text-[var(--text-faint)] hover:text-[var(--text-strong)]">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl grad-bg flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-strong)]">Chat with your own key</h3>
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-3 leading-relaxed">
              Each message runs 1-2 quick GPT-4o calls. Paste your own OpenAI key to chat freely,
              or close this and try the rate-limited shared demo key instead.
            </p>

            <label className="block text-xs font-semibold text-[var(--text-muted)] mt-5 mb-1.5">
              OpenAI API key
            </label>
            <input
              type="password" value={draft} onChange={(e) => setDraft(e.target.value)}
              placeholder="sk-..." autoComplete="off"
              className="field w-full px-4 py-3 text-sm font-mono" />

            <div className="mt-3 flex items-start gap-2 text-xs text-[var(--text-faint)]">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--ok)" }} />
              <span>
                Stored only in your browser (localStorage) and sent directly to the backend per
                request. Never logged or persisted server-side.
              </span>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button onClick={() => { setApiKey(draft.trim()); setDialogOpen(false); }}
                className="flex-1 px-4 py-3 rounded-2xl font-semibold text-white grad-bg disabled:opacity-50">
                Save key
              </button>
              {apiKey && (
                <button onClick={() => { setApiKey(""); setDraft(""); }}
                  className="px-4 py-3 rounded-2xl border text-[var(--text-muted)] hover:text-[var(--stop)] hover:border-[var(--stop-bd)] flex items-center gap-1.5"
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