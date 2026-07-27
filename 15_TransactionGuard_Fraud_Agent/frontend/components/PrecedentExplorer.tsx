"use client";

import { useEffect, useState } from "react";
import { BrainCircuit } from "lucide-react";
import { getPrecedents, type Precedent } from "@/lib/api";
import { useLiveSocket } from "./LiveSocketProvider";
import RiskBadge from "./RiskBadge";

export default function PrecedentExplorer() {
  const { lastEvent } = useLiveSocket();
  const [precedents, setPrecedents] = useState<Precedent[]>([]);

  useEffect(() => {
    getPrecedents(undefined, 12).then(setPrecedents);
  }, [lastEvent]);

  return (
    <section id="memory" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
      <div className="flex items-center gap-2 mb-1">
        <BrainCircuit className="w-4 h-4" style={{ color: "var(--accent)" }} />
        <span className="eyebrow text-xs font-bold tracking-widest uppercase" style={{ color: "var(--accent)" }}>
          Episodic memory
        </span>
      </div>
      <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-strong)]">
        What the agent remembers
      </h2>
      <p className="mt-3 text-[var(--text-muted)] max-w-2xl">
        Every verdict is embedded (OpenAI <code className="mono">text-embedding-3-small</code>)
        and stored in Postgres via <code className="mono">pgvector</code>. Future investigations
        retrieve the closest precedent before deciding — real cases, not a static rulebook.
      </p>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {precedents.length === 0 && (
          <div className="col-span-full text-sm text-[var(--text-faint)] p-6 text-center card rounded-2xl">
            No precedents stored yet — they accumulate as investigations complete.
          </div>
        )}
        {precedents.map((p) => (
          <div key={p.id} className="card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <RiskBadge risk={p.risk_level} />
              <span className="text-[10px] font-mono text-[var(--text-faint)]">{p.account_id}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-4">{p.summary}</p>
          </div>
        ))}
      </div>
    </section>
  );
}