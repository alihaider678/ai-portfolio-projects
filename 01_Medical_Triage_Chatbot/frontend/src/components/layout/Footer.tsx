import { Activity, Shield } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div
        className="py-10 px-4 sm:px-6"
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d1f38 100%)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Activity className="size-3.5 text-primary" />
            </div>
            <span className="text-white font-semibold text-sm">MediTriage AI</span>
            <span className="text-xs text-white/50">Portfolio Project 01</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Shield className="size-3.5" />
            <span>AI demo only — not a substitute for medical advice</span>
          </div>

          <p className="text-xs text-white/50">
            Built by{' '}
            <a
              href="https://linkedin.com/in/alihaider678"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors"
            >
              Ali Haider
            </a>
            {' '}· LangGraph + RAG + OpenAI
          </p>
        </div>
      </div>
    </footer>
  )
}