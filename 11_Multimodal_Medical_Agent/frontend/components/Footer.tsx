"use client";

import { Activity, ExternalLink, Heart } from "lucide-react";

const techStack = [
  { label: "Next.js 15", desc: "Frontend" },
  { label: "FastAPI", desc: "Backend" },
  { label: "GPT-4o Vision", desc: "Prescription AI" },
  { label: "Whisper", desc: "Voice Input" },
  { label: "ChromaDB", desc: "Vector Store" },
  { label: "OpenAI TTS", desc: "Audio Output" },
  { label: "ElevenLabs", desc: "Studio TTS" },
  { label: "Upstash Redis", desc: "Job Queue" },
];

export default function Footer() {
  return (
    <footer className="border-t border-cyan-500/10 bg-[var(--surf-0)] py-14 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-[var(--tx-heading)]">MedAI</span>
                <span className="font-bold text-cyan-400"> Nexus</span>
              </div>
            </div>
            <p className="text-[var(--tx-4)] text-sm leading-relaxed">
              Multimodal Medical Reference Agent. Reads prescriptions, understands medical PDFs,
              and answers clinical questions with images and voice.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[var(--tx-4)] hover:text-[var(--tx-heading)] transition-colors">
                <ExternalLink className="w-4 h-4" /> GitHub
              </a>
              <span className="text-[var(--tx-6)]">·</span>
              <a href="#app" className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                <ExternalLink className="w-4 h-4" /> Live Demo
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--tx-heading)] mb-4 uppercase tracking-widest">Navigation</h4>
            <ul className="space-y-2">
              {[
                { label: "Prescription Reader", href: "#app" },
                { label: "PDF Knowledge Base", href: "#app" },
                { label: "Ask Knowledge Base", href: "#app" },
                { label: "How It Works", href: "#how-it-works" },
                { label: "FAQ", href: "#faq" },
              ].map(link => (
                <li key={link.label}>
                  <a href={link.href} className="text-[var(--tx-4)] hover:text-[var(--tx-2)] text-sm transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech stack */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--tx-heading)] mb-4 uppercase tracking-widest">Built With</h4>
            <div className="flex flex-wrap gap-2">
              {techStack.map(t => (
                <div key={t.label} className="flex flex-col items-start px-3 py-1.5 rounded-lg border border-[var(--bd-1)] bg-[var(--surf-1)]">
                  <span className="text-xs font-semibold text-[var(--tx-2)]">{t.label}</span>
                  <span className="text-[10px] text-[var(--tx-5)]">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--bd-1)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[var(--tx-5)] text-sm">
            © 2025 MedAI Nexus · AI Portfolio Project 11
          </p>
          <p className="text-[var(--tx-5)] text-sm flex items-center gap-1.5">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500" /> by Ali Haider
            <span className="mx-1">·</span>
            <span className="text-cyan-600">BYOK · Zero server-side key storage</span>
          </p>
        </div>
      </div>
    </footer>
  );
}