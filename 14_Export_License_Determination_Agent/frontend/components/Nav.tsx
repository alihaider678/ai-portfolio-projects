"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, KeyRound, Code2, Circle } from "lucide-react";
import { getHealth, type Health } from "@/lib/api";
import { useApiKey } from "./ApiKeyProvider";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  ["Problem", "#problem"],
  ["Try it", "#try"],
  ["How it works", "#how"],
  ["FAQ", "#faq"],
];

export default function Nav() {
  const [health, setHealth] = useState<Health | null>(null);
  const { hasKey, setDialogOpen } = useApiKey();

  useEffect(() => {
    const run = () => getHealth().then(setHealth);
    run();
    const id = setInterval(run, 30000);
    return () => clearInterval(id);
  }, []);

  const online = health?.agent_ready;

  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur-xl"
      style={{ background: "color-mix(in srgb, var(--bg) 78%, transparent)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <a href="#top" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl grad-bg flex items-center justify-center glow">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-[var(--text-strong)] tracking-tight display">
              License<span className="grad-text">Guard</span>
            </div>
            <div className="text-[10px] text-[var(--text-faint)] -mt-0.5">Export-license agent</div>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map(([l, h]) => (
            <a key={l} href={h}
              className="px-3 py-1.5 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-strong)]">
              {l}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium ${
            online == null ? "text-[var(--text-faint)]" : online ? "text-[var(--ok)]" : "text-[var(--stop)]"}`}>
            <Circle className={`w-2 h-2 ${online ? "fill-current pulse" : "fill-current"}`} />
            {online == null ? "…" : online ? "Agent live" : "Offline"}
          </div>

          <button onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:border-[var(--accent)]"
            style={{ background: "var(--surface)" }} title="Use your own OpenAI key">
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{hasKey ? "Key set" : "API key"}</span>
            {hasKey && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--ok)" }} />}
          </button>

          <a href="https://github.com/alihaider678/ai-portfolio-projects" target="_blank"
            rel="noopener noreferrer" aria-label="GitHub"
            className="w-9 h-9 rounded-lg border flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:border-[var(--accent)]"
            style={{ background: "var(--surface)" }}>
            <Code2 className="w-4 h-4" />
          </a>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}