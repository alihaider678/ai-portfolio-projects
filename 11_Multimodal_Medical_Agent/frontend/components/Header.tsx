"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Key, Wifi, WifiOff, ChevronRight } from "lucide-react";
import { useApiKeys } from "@/context/ApiKeysContext";
import { checkHealth } from "@/lib/api";
import ApiKeysModal from "./ApiKeysModal";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const { hasOpenAIKey, keys } = useApiKeys();
  const [modalOpen, setModalOpen] = useState(false);
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const check = async () => setHealthy(await checkHealth());
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let ticking = false;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 20);
        ticking = false;
      });
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-[var(--body-bg)] border-b border-cyan-500/10 shadow-lg shadow-black/10"
            : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-[var(--foreground)] text-base tracking-tight">MedAI</span>
              <span className="font-bold text-cyan-500 text-base tracking-tight"> Nexus</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 status-live" />
              <span className="text-[10px] text-cyan-500 font-semibold tracking-wide">v1.0</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {["Features", "How It Works", "FAQ"].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="px-3 py-1.5 rounded-lg text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all font-medium"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2.5">
            {/* Backend status */}
            <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium ${healthy === null ? "text-[var(--tx-4)]" : healthy ? "text-emerald-500" : "text-rose-500"}`}>
              {healthy ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{healthy === null ? "Checking…" : healthy ? "Live" : "Offline"}</span>
            </div>

            {/* TTS badge */}
            {hasOpenAIKey && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-emerald-500 font-semibold">
                  {keys.tts_provider === "elevenlabs" ? "ElevenLabs" : "OpenAI"} TTS
                </span>
              </div>
            )}

            {/* Theme toggle */}
            <ThemeToggle />

            {/* API Keys */}
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/20 hover:border-cyan-500/55 text-sm font-semibold transition-all"
            >
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">{hasOpenAIKey ? "Keys ✓" : "Set API Keys"}</span>
              <ChevronRight className="w-3.5 h-3.5 hidden sm:block" />
            </button>
          </div>
        </div>
      </motion.header>

      <ApiKeysModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}