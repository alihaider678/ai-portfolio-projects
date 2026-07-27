"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, KeyRound, Radio } from "lucide-react";
import { useApiKey } from "./ApiKeyProvider";
import { useLiveSocket } from "./LiveSocketProvider";
import ThemeToggle from "./ThemeToggle";

const LINKS: [string, string][] = [
  ["Console", "#console"],
  ["Live Feed", "#feed"],
  ["Accuracy", "#accuracy"],
  ["How it works", "#how"],
  ["FAQ", "#faq"],
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { hasKey, setDialogOpen } = useApiKey();
  const { connected } = useLiveSocket();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 border-b transition-colors"
      style={{
        background: scrolled ? "color-mix(in srgb, var(--bg) 85%, transparent)" : "color-mix(in srgb, var(--bg) 45%, transparent)",
        backdropFilter: "blur(10px)",
        borderColor: scrolled ? "var(--border-strong)" : "var(--border)",
      }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg grad-bg flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold display tracking-tight text-[var(--text-strong)]">
            TransactionGuard
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map(([label, href]) => (
            <a key={label} href={href}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-strong)]">
              {label}
            </a>
          ))}
          <a href="/ops"
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-strong)]">
            Ops dashboard
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--text-faint)]" title="Live feed connection">
            <Radio className={`w-3.5 h-3.5 ${connected ? "" : "opacity-40"}`}
              style={{ color: connected ? "var(--ok)" : "var(--text-faint)" }} />
            {connected ? "live" : "offline"}
          </div>
          <button onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border chip">
            <KeyRound className="w-3.5 h-3.5" style={{ color: hasKey ? "var(--ok)" : "var(--text-faint)" }} />
            {hasKey ? "Key saved" : "Add API key"}
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}