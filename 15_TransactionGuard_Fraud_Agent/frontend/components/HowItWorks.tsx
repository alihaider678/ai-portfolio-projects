import { AlertTriangle } from "lucide-react";
import FlowDiagram from "./FlowDiagram";

const STACK: [string, string][] = [
  ["Agent framework", "LangGraph — conditional/looping edges"],
  ["LLM", "OpenAI GPT-4o (triage · evaluate · verdict) + text-embedding-3-small"],
  ["Memory / RAG", "Postgres + pgvector (episodic precedent storage & retrieval)"],
  ["Backend", "FastAPI, asyncpg, Redis (rate limiting + history cache), WebSockets"],
  ["Auth", "JWT (jose) — analyst ops-dashboard login"],
  ["Frontend", "Next.js, TypeScript, Tailwind, framer-motion"],
  ["Data", "Synthetic transaction generator (50 accounts, ~1,700 transactions)"],
];

export default function HowItWorks() {
  return (
    <section id="how" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
      <span className="eyebrow text-xs font-bold tracking-widest uppercase" style={{ color: "var(--accent)" }}>
        How it works
      </span>
      <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[var(--text-strong)]">
        Reasoning, not a checklist
      </h2>

      <div className="mt-6 grid lg:grid-cols-2 gap-8">
        <div className="space-y-4 text-[var(--text-muted)] leading-relaxed">
          <p>
            <strong className="text-[var(--text-strong)]">The problem.</strong> Digital wallets
            are a high-value fraud target — sudden high-value transfers, rapid repeated
            transactions, and geographic anomalies all need catching quickly. Most fraud systems
            run a fixed set of checks on every transaction and hand back an opaque score.
          </p>
          <p>
            <strong className="text-[var(--text-strong)]">Why an agent, not a pipeline.</strong>{" "}
            A fixed pipeline that always runs every check, then has an LLM summarize the
            result, isn&apos;t really agentic — it&apos;s automation with narration. This agent
            decides <em>which</em> check to run first based on a hypothesis, decides after each
            check whether it has enough evidence or should keep investigating (a real
            conditional loop in the LangGraph, capped at one pass per check), and consults its
            own memory of similar past cases before ruling.
          </p>
          <p>
            <strong className="text-[var(--text-strong)]">The data.</strong> There&apos;s no real
            wallet transaction data available, so the dataset is entirely synthetic — generated
            with a deliberate mix of normal behavior and injected anomalies (velocity bursts,
            amount spikes, geo jumps, new-device transactions), openly labeled for evaluation
            only and never shown to the agent.
          </p>
          <div className="flex items-start gap-2 text-xs p-3 rounded-lg risk-medium mt-4">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            Portfolio demonstration using synthetic data — not a substitute for a licensed,
            certified fraud-prevention system.
          </div>
        </div>

        <div className="card-solid rounded-2xl p-5">
          <FlowDiagram />
          <table className="w-full mt-8 text-xs">
            <tbody>
              {STACK.map(([k, v]) => (
                <tr key={k} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="py-2.5 pr-4 font-semibold text-[var(--text-strong)] whitespace-nowrap align-top">{k}</td>
                  <td className="py-2.5 text-[var(--text-muted)]">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}