"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertOctagon, Activity } from "lucide-react";
import { listInvestigations, type Investigation } from "@/lib/api";
import { useLiveSocket } from "./LiveSocketProvider";
import RiskBadge from "./RiskBadge";

interface Row {
  investigation_id: string;
  transaction_id: string;
  account_id: string;
  risk_level: string | null;
  action: string | null;
  explanation: string | null;
  error?: string;
  fresh?: boolean;
}

function fromInvestigation(inv: Investigation): Row {
  return {
    investigation_id: inv.id, transaction_id: inv.transaction_id, account_id: inv.account_id,
    risk_level: inv.risk_level, action: inv.action, explanation: inv.explanation,
  };
}

export default function LiveFeed() {
  const { lastEvent } = useLiveSocket();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    listInvestigations({ limit: 20, status: "complete" }).then((list) => setRows(list.map(fromInvestigation)));
  }, []);

  useEffect(() => {
    if (!lastEvent) return;
    setRows((prev) => {
      if (prev.some((r) => r.investigation_id === lastEvent.investigation_id)) return prev;
      const row: Row = {
        investigation_id: lastEvent.investigation_id,
        transaction_id: lastEvent.transaction_id ?? "",
        account_id: lastEvent.account_id ?? "",
        risk_level: lastEvent.risk_level ?? null,
        action: lastEvent.action ?? null,
        explanation: lastEvent.explanation ?? null,
        error: lastEvent.type === "investigation_error" ? lastEvent.error : undefined,
        fresh: true,
      };
      return [row, ...prev].slice(0, 30);
    });
  }, [lastEvent]);

  return (
    <section id="feed" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
      <div className="flex items-center gap-2 mb-1">
        <Activity className="w-4 h-4" style={{ color: "var(--accent)" }} />
        <span className="eyebrow text-xs font-bold tracking-widest uppercase" style={{ color: "var(--accent)" }}>
          Live feed
        </span>
      </div>
      <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-strong)]">
        Investigations across every account
      </h2>
      <p className="mt-3 text-[var(--text-muted)] max-w-2xl">
        Updates live over WebSocket the moment an investigation completes — including ones
        triggered by other visitors right now.
      </p>

      <div className="mt-8 card rounded-2xl divide-y" style={{ borderColor: "var(--border)" }}>
        {rows.length === 0 && (
          <div className="p-8 text-center text-sm text-[var(--text-faint)]">
            No investigations yet — run one in the console above.
          </div>
        )}
        <AnimatePresence initial={false}>
          {rows.map((r) => (
            <motion.div key={r.investigation_id} layout
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-4 flex items-center gap-3 flex-wrap sm:flex-nowrap"
              style={{ borderColor: "var(--border)" }}>
              {r.error ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border risk-high">
                  <AlertOctagon className="w-3 h-3" /> ERROR
                </span>
              ) : (
                <RiskBadge risk={r.risk_level} />
              )}
              <span className="text-xs font-mono text-[var(--text-faint)] shrink-0">{r.account_id}</span>
              <span className="text-xs font-mono text-[var(--text-faint)] shrink-0 hidden sm:inline">
                {r.transaction_id.replace("TXN-", "")}
              </span>
              <span className="text-sm text-[var(--text-muted)] truncate flex-1 min-w-[140px]">
                {r.error ?? r.explanation}
              </span>
              {r.action && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border chip shrink-0">{r.action}</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}