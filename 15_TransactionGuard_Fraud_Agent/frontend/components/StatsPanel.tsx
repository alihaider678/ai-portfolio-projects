"use client";

import { useEffect, useState } from "react";
import { Users, Receipt, ShieldCheck, TrendingUp, Target, Crosshair } from "lucide-react";
import { getStats, getEvalAccuracy, type Stats, type EvalAccuracy } from "@/lib/api";
import { useLiveSocket } from "./LiveSocketProvider";

function Tile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="card rounded-xl p-4">
      <Icon className="w-4 h-4 mb-2" style={{ color: "var(--accent)" }} />
      <div className="text-2xl font-extrabold text-[var(--text-strong)] display">{value}</div>
      <div className="text-xs text-[var(--text-faint)] mt-0.5">{label}</div>
    </div>
  );
}

export default function StatsPanel() {
  const { lastEvent } = useLiveSocket();
  const [stats, setStats] = useState<Stats | null>(null);
  const [evalAcc, setEvalAcc] = useState<EvalAccuracy | null>(null);

  useEffect(() => {
    getStats().then(setStats);
    getEvalAccuracy().then(setEvalAcc);
  }, [lastEvent]);

  if (!stats) return null;
  const dist = stats.risk_distribution ?? {};
  const distTotal = Object.values(dist).reduce((a, b) => a + b, 0) || 1;

  return (
    <section id="accuracy" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
      <span className="eyebrow text-xs font-bold tracking-widest uppercase" style={{ color: "var(--accent)" }}>
        Proof, not just claims
      </span>
      <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[var(--text-strong)]">
        Stats &amp; accuracy
      </h2>
      <p className="mt-3 text-[var(--text-muted)] max-w-2xl">
        Every completed investigation is checked against the synthetic dataset&apos;s ground-truth
        anomaly labels — this is measured, not asserted.
      </p>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile icon={Users} label="Accounts" value={stats.total_accounts} />
        <Tile icon={Receipt} label="Transactions" value={stats.total_transactions.toLocaleString()} />
        <Tile icon={ShieldCheck} label="Investigations run" value={stats.total_investigations} />
        <Tile icon={TrendingUp} label="Flagged" value={`${stats.flagged_pct}%`} />
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <div className="card rounded-2xl p-5">
          <div className="text-sm font-semibold text-[var(--text-strong)] mb-3">Risk distribution</div>
          <div className="flex h-3 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
            {(["LOW", "MEDIUM", "HIGH"] as const).map((k) => {
              const pct = ((dist[k] ?? 0) / distTotal) * 100;
              if (!pct) return null;
              return <div key={k} className={`h-full dot-${k.toLowerCase()}`} style={{ width: `${pct}%` }} title={`${k}: ${dist[k] ?? 0}`} />;
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-[var(--text-muted)]">
            {(["LOW", "MEDIUM", "HIGH"] as const).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full dot-${k.toLowerCase()}`} /> {k}: {dist[k] ?? 0}
              </span>
            ))}
          </div>
        </div>

        <div className="card rounded-2xl p-5">
          <div className="text-sm font-semibold text-[var(--text-strong)] mb-3">Precision / recall vs. synthetic ground truth</div>
          {evalAcc?.available ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4" style={{ color: "var(--ok)" }} />
                <div>
                  <div className="text-xl font-extrabold text-[var(--text-strong)]">
                    {evalAcc.precision != null ? `${Math.round(evalAcc.precision * 100)}%` : "—"}
                  </div>
                  <div className="text-[11px] text-[var(--text-faint)]">Precision</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" style={{ color: "var(--accent)" }} />
                <div>
                  <div className="text-xl font-extrabold text-[var(--text-strong)]">
                    {evalAcc.recall != null ? `${Math.round(evalAcc.recall * 100)}%` : "—"}
                  </div>
                  <div className="text-[11px] text-[var(--text-faint)]">Recall</div>
                </div>
              </div>
              <p className="col-span-2 text-[11px] text-[var(--text-faint)] leading-relaxed">
                Based on {evalAcc.evaluated} completed investigations. Note: the very first
                transaction in an injected burst is inherently indistinguishable from normal
                activity before the rest of the burst happens — recall is naturally capped
                below 100% by design, the same way a real analyst couldn&apos;t catch it either.
              </p>
            </div>
          ) : (
            <p className="text-xs text-[var(--text-faint)]">Run a few investigations in the console to populate this.</p>
          )}
        </div>
      </div>
    </section>
  );
}