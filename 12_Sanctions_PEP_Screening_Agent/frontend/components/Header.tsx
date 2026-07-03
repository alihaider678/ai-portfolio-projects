"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { checkHealth } from "@/lib/api";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    const run = async () => setHealthy(await checkHealth());
    run();
    const id = setInterval(run, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{ background: "color-mix(in srgb, var(--bg) 85%, transparent)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-extrabold text-[var(--text-strong)] tracking-tight">
              Aegis<span className="grad-text">Screen</span>
            </div>
            <div className="text-[10px] text-[var(--text-faint)] -mt-0.5">Sanctions &amp; PEP Screening</div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {[["Screen", "#screen"], ["How it works", "#how"], ["Tech", "#tech"]].map(([l, h]) => (
            <a key={l} href={h}
              className="px-3 py-1.5 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-strong)]">
              {l}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium ${
            healthy === null ? "text-[var(--text-faint)]" : healthy ? "text-emerald-500" : "text-rose-500"}`}>
            {healthy ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {healthy === null ? "…" : healthy ? "API live" : "API offline"}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}