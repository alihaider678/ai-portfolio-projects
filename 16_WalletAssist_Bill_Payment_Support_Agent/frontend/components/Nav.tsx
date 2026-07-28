"use client";

import { Wallet } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: "color-mix(in srgb, var(--bg) 82%, transparent)", borderBottom: "1px solid var(--border)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl grad-bg flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[var(--text-strong)]">WalletAssist</span>
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-[var(--text-muted)]">
          <a href="#how-it-works" className="hover:text-[var(--text-strong)]">How it works</a>
          <a href="#faq" className="hover:text-[var(--text-strong)]">FAQ</a>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}