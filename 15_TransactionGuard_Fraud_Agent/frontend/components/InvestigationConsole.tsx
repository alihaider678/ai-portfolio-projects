"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, KeyRound, Sparkles, FlaskConical, AlertTriangle } from "lucide-react";
import {
  getAccounts, getHistory, investigate, getInvestigation,
  type Account, type Transaction, type Investigation,
} from "@/lib/api";
import { useApiKey } from "./ApiKeyProvider";
import { useLiveSocket } from "./LiveSocketProvider";
import ReasoningTrail from "./ReasoningTrail";
import RiskBadge from "./RiskBadge";
import Select from "./Select";

export default function InvestigationConsole() {
  const { apiKey, hasKey, setDialogOpen } = useApiKey();
  const { lastEvent } = useLiveSocket();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionId, setTransactionId] = useState("");
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(true);

  useEffect(() => {
    setAccountsLoading(true);
    getAccounts().then((list) => {
      const sorted = [...list].sort((a, b) => b.anomaly_count - a.anomaly_count);
      setAccounts(sorted);
      if (sorted.length) setAccountId(sorted[0].account_id);
      setAccountsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!accountId) return;
    setTransactionId("");
    getHistory(accountId).then((txns) => {
      const sorted = [...txns].sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1));
      setTransactions(sorted);
      if (sorted.length) setTransactionId(sorted[0].transaction_id);
    });
  }, [accountId]);

  // Poll fallback + WebSocket push, whichever lands first.
  useEffect(() => {
    if (!investigation || investigation.status !== "running") return;
    let cancelled = false;
    const poll = setInterval(async () => {
      const fresh = await getInvestigation(investigation.id);
      if (fresh && !cancelled && fresh.status !== "running") setInvestigation(fresh);
    }, 2500);
    return () => { cancelled = true; clearInterval(poll); };
  }, [investigation]);

  useEffect(() => {
    if (!lastEvent || !investigation || lastEvent.investigation_id !== investigation.id) return;
    getInvestigation(investigation.id).then((fresh) => fresh && setInvestigation(fresh));
  }, [lastEvent, investigation]);

  const selectedTxn = useMemo(
    () => transactions.find((t) => t.transaction_id === transactionId),
    [transactions, transactionId]
  );

  async function runInvestigation(useDemo: boolean) {
    if (!transactionId) return;
    setSubmitting(true);
    setError(null);
    setInvestigation(null);
    try {
      const res = await investigate({ transactionId, apiKey: useDemo ? "" : apiKey, useDemoKey: useDemo });
      setInvestigation({
        id: res.investigation_id, status: "running", transaction_id: transactionId,
        risk_level: null, action: null, explanation: null, hypothesis: null, checks_run: [],
        reasoning_trail: [], precedent_used: null, iterations: 0, analyst_feedback: null,
        analyst_id: null, feedback_at: null, created_at: new Date().toISOString(), completed_at: null,
        account_id: accountId, amount: selectedTxn?.amount ?? 0, city: selectedTxn?.city ?? "",
        country: selectedTxn?.country ?? "", method: selectedTxn?.method ?? "", occurred_at: selectedTxn?.occurred_at ?? "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Investigation failed to start.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="console" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
      <div className="max-w-2xl">
        <div className="eyebrow text-xs font-bold tracking-widest uppercase" style={{ color: "var(--accent)" }}>
          Live console
        </div>
        <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[var(--text-strong)]">
          Investigate a transaction
        </h2>
        <p className="mt-3 text-[var(--text-muted)]">
          Pick an account and a transaction from the synthetic dataset, then watch the agent
          reason through it step by step — the same reasoning trail an ops analyst would see.
        </p>
      </div>

      <div className="mt-8 grid lg:grid-cols-[1fr_1.3fr] gap-6">
        {/* Picker + run controls */}
        <div className="card rounded-2xl p-5 space-y-4 h-fit">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">Account</label>
            {accountsLoading && accounts.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-faint)] mb-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Waking up the backend — first load after idle can take up to a minute…
              </div>
            )}
            <Select
              value={accountId}
              onChange={setAccountId}
              placeholder={accountsLoading ? "Loading accounts…" : "Select…"}
              options={accounts.map((a) => ({
                value: a.account_id,
                label: `${a.account_id} · ${a.display_name} · ${a.home_city}`,
                meta: a.anomaly_count > 0 ? (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border risk-medium">
                    {a.anomaly_count} anomal{a.anomaly_count === 1 ? "y" : "ies"}
                  </span>
                ) : undefined,
              }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">Transaction</label>
            <Select
              mono
              value={transactionId}
              onChange={setTransactionId}
              options={transactions.map((t) => ({
                value: t.transaction_id,
                label: `${t.transaction_id.replace("TXN-", "")} · ${t.amount.toFixed(0)} ${t.currency} · ${t.city} · ${new Date(t.occurred_at).toLocaleDateString()}`,
                meta: t.is_synthetic_anomaly ? (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border risk-medium whitespace-nowrap">
                    {t.anomaly_type}
                  </span>
                ) : undefined,
              }))}
            />
            {selectedTxn?.is_synthetic_anomaly && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--warn)]">
                <FlaskConical className="w-3.5 h-3.5" />
                Ground-truth label: synthetic anomaly ({selectedTxn.anomaly_type}) — evaluation only, never shown to the agent.
              </div>
            )}
          </div>

          <div className="pt-2 space-y-2">
            {hasKey ? (
              <button onClick={() => runInvestigation(false)} disabled={submitting || !transactionId}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white grad-bg glow disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Investigate with my key
              </button>
            ) : (
              <button onClick={() => setDialogOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white grad-bg glow">
                <KeyRound className="w-4 h-4" /> Add your OpenAI key
              </button>
            )}
            <button onClick={() => runInvestigation(true)} disabled={submitting || !transactionId}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold border chip disabled:opacity-50">
              <Sparkles className="w-4 h-4" /> Try demo (rate-limited shared key)
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs p-2.5 rounded-lg risk-high">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
            </div>
          )}
        </div>

        {/* Result */}
        <div className="card rounded-2xl p-5 min-h-[320px]">
          <AnimatePresence mode="wait">
            {!investigation && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center py-16 text-[var(--text-faint)]">
                <Search className="w-8 h-8 mb-3 opacity-50" />
                <p className="text-sm">Pick a transaction and run an investigation to see the agent&apos;s reasoning here.</p>
              </motion.div>
            )}

            {investigation && investigation.status === "running" && (
              <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center py-16">
                <Loader2 className="w-8 h-8 mb-3 animate-spin" style={{ color: "var(--accent)" }} />
                <p className="text-sm font-semibold text-[var(--text-strong)]">Agent is investigating…</p>
                <p className="text-xs text-[var(--text-faint)] mt-1">
                  Forming a hypothesis, running checks, deciding when it has enough evidence — usually 8-20s.
                </p>
              </motion.div>
            )}

            {investigation && investigation.status === "error" && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center py-16">
                <AlertTriangle className="w-8 h-8 mb-3" style={{ color: "var(--stop)" }} />
                <p className="text-sm font-semibold text-[var(--text-strong)]">Investigation failed</p>
                <p className="text-xs text-[var(--text-faint)] mt-1 max-w-sm">{investigation.explanation}</p>
              </motion.div>
            )}

            {investigation && investigation.status === "complete" && (
              <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <RiskBadge risk={investigation.risk_level} />
                    <span className="text-xs font-mono px-2 py-1 rounded border chip uppercase">{investigation.action}</span>
                  </div>
                  <span className="text-[11px] text-[var(--text-faint)]">
                    {investigation.iterations} check{investigation.iterations === 1 ? "" : "s"} run
                  </span>
                </div>
                <p className="text-sm text-[var(--text)] mb-5 leading-relaxed">{investigation.explanation}</p>
                <ReasoningTrail trail={investigation.reasoning_trail} riskLevel={investigation.risk_level} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}