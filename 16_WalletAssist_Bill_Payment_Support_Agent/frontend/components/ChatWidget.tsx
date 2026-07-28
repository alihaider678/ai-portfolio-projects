"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ChevronDown, KeyRound, Sparkles, Wallet, AlertTriangle, Check } from "lucide-react";
import { getAccounts, sendChat, type Account, type ChatResponse } from "@/lib/api";
import { useApiKey } from "./ApiKeyProvider";
import PathBadge from "./PathBadge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  path?: ChatResponse["path_taken"];
  transaction?: ChatResponse["transaction_result"];
  error?: boolean;
}

const STARTERS = [
  "How do I split a bill?",
  "Why did my last payment fail?",
  "What are the transaction limits?",
  "How do top-ups work?",
];

function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function ChatWidget() {
  const { apiKey, hasKey, setDialogOpen } = useApiKey();
  const [sessionId] = useState(() => newId());
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [useDemoKey, setUseDemoKey] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAccounts().then(setAccounts);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const canChat = hasKey || useDemoKey;
  const selectedAccount = accounts.find((a) => a.account_id === accountId);

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (!canChat) {
      setDialogOpen(true);
      return;
    }
    setMessages((m) => [...m, { id: newId(), role: "user", content: trimmed }]);
    setInput("");
    setSending(true);
    try {
      const res = await sendChat({
        sessionId, message: trimmed, accountId: accountId ?? undefined,
        apiKey: useDemoKey ? undefined : apiKey, useDemoKey,
      });
      setMessages((m) => [...m, {
        id: newId(), role: "assistant", content: res.response,
        path: res.path_taken, transaction: res.transaction_result ?? undefined,
      }]);
    } catch (e) {
      setMessages((m) => [...m, {
        id: newId(), role: "assistant",
        content: e instanceof Error ? e.message : "Something went wrong — please try again.",
        error: true,
      }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl grad-bg flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--text-strong)] leading-tight">WalletAssist</div>
            <div className="text-[11px] text-[var(--ok)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] pulse-ring" style={{ background: "var(--ok)" }} />
              Online
            </div>
          </div>
        </div>

        <div className="relative" ref={accountMenuRef}>
          <button onClick={() => setAccountMenuOpen((v) => !v)}
            className="chip flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium">
            {selectedAccount ? selectedAccount.display_name.split(" ")[0] : "Guest"}
            <ChevronDown className="w-3 h-3" />
          </button>
          <AnimatePresence>
            {accountMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="absolute right-0 mt-1.5 w-48 max-h-56 overflow-y-auto panel-solid p-1.5 z-30">
                <button onClick={() => { setAccountId(null); setAccountMenuOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left hover:bg-[var(--surface-2)]">
                  Guest (no account)
                  {!accountId && <Check className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />}
                </button>
                {accounts.map((a) => (
                  <button key={a.account_id} onClick={() => { setAccountId(a.account_id); setAccountMenuOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left hover:bg-[var(--surface-2)]">
                    <span className="truncate">{a.display_name} · {a.account_id}</span>
                    {accountId === a.account_id && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 rise">
            <div className="w-12 h-12 rounded-2xl grad-bg flex items-center justify-center mb-3">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-semibold text-[var(--text-strong)]">Hi! I&apos;m WalletAssist.</p>
            <p className="text-xs text-[var(--text-faint)] mt-1 max-w-[240px]">
              Ask me about bill payments, top-ups, or a transaction on your account.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 mt-4">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => submit(s)} className="pill">{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%]">
              {m.role === "assistant" && m.path && (
                <div className="mb-1"><PathBadge path={m.path} /></div>
              )}
              <div className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bubble-user" : "bubble-agent"} ${m.error ? "border-[var(--stop-bd)]" : ""}`}>
                {m.error && <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" style={{ color: "var(--stop)" }} />}
                {m.content}
              </div>
              {m.transaction && (
                <div className="mt-1.5 chip text-[11px] px-3 py-2 rounded-2xl font-mono">
                  {m.transaction.transaction_id} · {m.transaction.amount} {m.transaction.currency} ·{" "}
                  <span className={m.transaction.status === "success" ? "text-[var(--ok)]" : m.transaction.status === "pending" ? "text-[var(--warn)]" : "text-[var(--stop)]"}>
                    {m.transaction.status}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bubble-agent px-4 py-3 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-faint)] typing-dot" style={{ animationDelay: "0s" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-faint)] typing-dot" style={{ animationDelay: ".15s" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-faint)] typing-dot" style={{ animationDelay: ".3s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Input / key gate */}
      <div className="px-4 py-3.5 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
        {!canChat ? (
          <div className="flex gap-2">
            <button onClick={() => setDialogOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl font-semibold text-white text-xs grad-bg">
              <KeyRound className="w-3.5 h-3.5" /> Add your key
            </button>
            <button onClick={() => setUseDemoKey(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl font-semibold text-xs chip">
              <Sparkles className="w-3.5 h-3.5" /> Try demo
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); submit(input); }} className="flex items-center gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your wallet..." disabled={sending}
              className="field flex-1 px-4 py-2.5 text-sm" />
            <button type="submit" disabled={sending || !input.trim()}
              className="w-10 h-10 rounded-2xl grad-bg flex items-center justify-center text-white disabled:opacity-40 shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </>
  );
}