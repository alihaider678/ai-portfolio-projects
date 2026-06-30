"use client";

import { FlaskConical, Code2, ExternalLink, Heart } from "lucide-react";

const TECH_LINKS = [
  { label: "LangGraph", href: "https://langchain-ai.github.io/langgraph/" },
  { label: "OpenFDA", href: "https://open.fda.gov/apis/" },
  { label: "PubMed E-utilities", href: "https://www.ncbi.nlm.nih.gov/home/develop/api/" },
  { label: "Upstash Redis", href: "https://upstash.com/" },
  { label: "FastAPI", href: "https://fastapi.tiangolo.com/" },
  { label: "ShadCN UI", href: "https://ui.shadcn.com/" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border-col)] bg-[var(--page-bg)] py-16 px-6 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-col)] to-[#a78bfa] flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-[var(--text-head)] tracking-tight">
                Rx<span className="text-[var(--accent-col)]">Safe</span> AI
              </span>
            </div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xs">
              Parallel LangGraph agents powered by OpenFDA and PubMed — delivering clinician-grade drug interaction reports in real time.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent-col)] transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                View Source
              </a>
              <span className="text-[var(--border-col-strong)]">·</span>
              <a
                href="#demo"
                className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent-col)] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Live Demo
              </a>
            </div>
          </div>

          {/* Tech links */}
          <div>
            <div className="text-xs font-semibold text-[var(--text-body)] uppercase tracking-wider mb-4">
              Built With
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TECH_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-col)] transition-colors py-1"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div>
            <div className="text-xs font-semibold text-[var(--text-body)] uppercase tracking-wider mb-4">
              Disclaimer
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              RxSafe AI is a portfolio demonstration tool using real OpenFDA and PubMed data. It is{" "}
              <span className="text-amber-600 dark:text-amber-400">not a substitute</span> for licensed clinical advice.
              Always consult a pharmacist or physician.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["FastAPI", "LangGraph", "GPT-4o", "Redis", "Next.js 15"].map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-2 py-0.5 rounded border border-[var(--border-col)] text-[var(--text-muted)] bg-[var(--section-bg)]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[var(--border-col)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--text-muted)]">© 2025 RxSafe AI — AI Portfolio Project 02</p>
          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            Built with <Heart className="w-3 h-3 text-red-500/70" /> using LangGraph · FastAPI · Redis · OpenFDA · PubMed
          </p>
        </div>
      </div>
    </footer>
  );
}