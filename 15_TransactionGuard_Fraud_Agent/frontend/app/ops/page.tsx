"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LogIn, LogOut, ShieldAlert, ThumbsDown, ThumbsUp, Loader2, ChevronDown } from "lucide-react";
import {
  getSession, login, logout, listInvestigations, submitFeedback, type Investigation,
} from "@/lib/api";
import RiskBadge from "@/components/RiskBadge";
import ReasoningTrail from "@/components/ReasoningTrail";

function OpsLogin({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [username, setUsername] = useState("analyst");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const ok = await login(username, password);
    setBusy(false);
    if (ok) onLoggedIn();
    else setError("Invalid username or password.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 mesh">
      <div className="grid-bg absolute inset-0 z-0" />
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative z-10 card-solid glow rounded-2xl p-7 w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-xl grad-bg flex items-center justify-center">
            <ShieldAlert className="w-4.5 h-4.5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-[var(--text-strong)]">Analyst sign-in</h1>
        </div>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Review escalated cases and confirm or dismiss the agent&apos;s verdicts.
        </p>

        <label className="block text-xs font-semibold text-[var(--text-muted)] mt-5 mb-1.5">Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)}
          className="field w-full px-3 py-2.5 rounded-xl text-sm" />

        <label className="block text-xs font-semibold text-[var(--text-muted)] mt-3 mb-1.5">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="field w-full px-3 py-2.5 rounded-xl text-sm" />

        {error && <p className="text-xs mt-2" style={{ color: "var(--stop)" }}>{error}</p>}

        <button type="submit" disabled={busy}
          className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white grad-bg disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />} Sign in
        </button>
      </motion.form>
    </div>
  );
}

function InvestigationRow({ inv, onFeedback }: { inv: Investigation; onFeedback: (id: string, fb: "confirmed_fraud" | "false_positive") => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function act(fb: "confirmed_fraud" | "false_positive") {
    setBusy(fb);
    await submitFeedback(inv.id, fb);
    onFeedback(inv.id, fb);
    setBusy(null);
  }

  return (
    <div className="card rounded-xl overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 p-4 text-left flex-wrap sm:flex-nowrap">
        <RiskBadge risk={inv.risk_level} />
        <span className="text-xs font-mono text-[var(--text-faint)]">{inv.account_id}</span>
        <span className="text-sm text-[var(--text-muted)] truncate flex-1 min-w-[160px]">{inv.explanation}</span>
        {inv.analyst_feedback && (
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border chip">{inv.analyst_feedback.replace("_", " ")}</span>
        )}
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="pt-4">
            <ReasoningTrail trail={inv.reasoning_trail} riskLevel={inv.risk_level} />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={() => act("confirmed_fraud")} disabled={busy !== null}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold risk-high disabled:opacity-50">
              {busy === "confirmed_fraud" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsDown className="w-3.5 h-3.5" />}
              Confirm fraud
            </button>
            <button onClick={() => act("false_positive")} disabled={busy !== null}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold risk-low disabled:opacity-50">
              {busy === "false_positive" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
              Mark false positive
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OpsPage() {
  const [checking, setChecking] = useState(true);
  const [session, setSession] = useState<{ username: string } | null>(null);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    getSession().then((s) => { setSession(s); setChecking(false); });
  }, []);

  useEffect(() => {
    if (!session) return;
    listInvestigations({ limit: 50, status: "complete", riskLevel: filter || undefined }).then(setInvestigations);
  }, [session, filter]);

  function handleFeedback(id: string, fb: "confirmed_fraud" | "false_positive") {
    setInvestigations((prev) => prev.map((i) => (i.id === id ? { ...i, analyst_feedback: fb } : i)));
  }

  if (checking) return null;
  if (!session) return <OpsLogin onLoggedIn={() => getSession().then(setSession)} />;

  return (
    <div className="min-h-screen">
      <header className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <span className="font-bold text-[var(--text-strong)]">Ops dashboard</span>
            <span className="text-xs text-[var(--text-faint)]">· {session.username}</span>
          </div>
          <button onClick={() => logout().then(() => setSession(null))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border chip">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-2 mb-5">
          {["", "HIGH", "MEDIUM", "LOW"].map((lvl) => (
            <button key={lvl} onClick={() => setFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${filter === lvl ? "grad-bg text-white" : "chip"}`}>
              {lvl || "All"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {investigations.length === 0 && (
            <div className="card rounded-2xl p-8 text-center text-sm text-[var(--text-faint)]">No investigations match this filter.</div>
          )}
          {investigations.map((inv) => (
            <InvestigationRow key={inv.id} inv={inv} onFeedback={handleFeedback} />
          ))}
        </div>
      </main>
    </div>
  );
}