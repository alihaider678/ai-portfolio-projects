"use client";

import { Receipt, CreditCard, Coins, ShieldCheck } from "lucide-react";
import PhoneFrame from "./PhoneFrame";
import ChatWidget from "./ChatWidget";

export default function Hero() {
  return (
    <section className="blob-field max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-24">
      <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
        {/* Copy */}
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full"
            style={{ color: "var(--accent)", background: "var(--accent-soft)" }}>
            <ShieldCheck className="w-3.5 h-3.5" /> Wallet &amp; bill-payment support agent
          </div>
          <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold leading-[1.08] text-[var(--text-strong)]">
            Ask your wallet<br />anything. <span className="grad-text">Get a real answer.</span>
          </h1>
          <p className="mt-5 text-base text-[var(--text-muted)] max-w-lg leading-relaxed">
            WalletAssist answers wallet and bill-payment questions grounded in real product
            knowledge — and checks your actual transaction data when the question is about
            your account, instead of guessing.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            <div className="panel px-3 py-3 text-center">
              <div className="text-lg font-extrabold text-[var(--text-strong)]">38</div>
              <div className="text-[11px] text-[var(--text-faint)] mt-0.5">real FAQ answers</div>
            </div>
            <div className="panel px-3 py-3 text-center">
              <div className="text-lg font-extrabold text-[var(--text-strong)]">RAG</div>
              <div className="text-[11px] text-[var(--text-faint)] mt-0.5">+ tool-calling</div>
            </div>
            <div className="panel px-3 py-3 text-center">
              <div className="text-lg font-extrabold text-[var(--text-strong)]">Honest</div>
              <div className="text-[11px] text-[var(--text-faint)] mt-0.5">human handoff</div>
            </div>
          </div>
        </div>

        {/* Phone mockup — the actual functional chat, not a screenshot */}
        <div className="relative flex justify-center">
          <div className="float-badge float-anim w-12 h-12 -left-2 top-8 hidden sm:flex"
            style={{ ["--r" as string]: "-8deg", background: "var(--accent-soft)", animationDelay: "0s" }}>
            <Receipt className="w-5 h-5" style={{ color: "var(--accent)" }} />
          </div>
          <div className="float-badge float-anim w-11 h-11 right-0 top-2 hidden sm:flex"
            style={{ ["--r" as string]: "10deg", background: "var(--accent2-soft)", animationDelay: "1.2s" }}>
            <Coins className="w-5 h-5" style={{ color: "var(--accent-2)" }} />
          </div>
          <div className="float-badge float-anim w-12 h-12 -right-4 bottom-16 hidden sm:flex"
            style={{ ["--r" as string]: "-6deg", background: "var(--ok-soft)", animationDelay: "2.1s" }}>
            <CreditCard className="w-5 h-5" style={{ color: "var(--ok)" }} />
          </div>

          <PhoneFrame>
            <ChatWidget />
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}