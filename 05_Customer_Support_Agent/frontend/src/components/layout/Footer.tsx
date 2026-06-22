import { Bot, ExternalLink, GitBranch } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-auto" style={{ background: 'linear-gradient(135deg, #152956 0%, #1a3468 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-white/90">
          <Bot className="size-5 text-cyan-400 shrink-0" />
          <span className="text-sm font-medium">
            Built by{' '}
            <a
              href="https://www.linkedin.com/in/ali-haider-ai-engineer/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 hover:text-cyan-200 font-semibold transition-colors"
            >
              Ali Haider
            </a>
            {' '}— AI Engineer
          </span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/alihaider678"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white/90 transition-colors"
          >
            <GitBranch className="size-3.5" />
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/ali-haider-ai-engineer/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white/90 transition-colors"
          >
            <ExternalLink className="size-3.5" />
            LinkedIn
          </a>
          <p className="text-xs text-white/40 hidden sm:block">
            LangGraph · LangChain · RAG · Redis · Celery · GPT-4o
          </p>
        </div>
      </div>
    </footer>
  )
}