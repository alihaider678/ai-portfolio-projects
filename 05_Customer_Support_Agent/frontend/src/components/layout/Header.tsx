'use client'

import { motion } from 'framer-motion'
import { Bot, GitBranch, ExternalLink, Sun, Moon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/components/ThemeProvider'

export default function Header() {
  const { theme, toggle } = useTheme()

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 glass border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Bot className="size-5 text-primary" />
          </div>
          <span className="text-base font-semibold text-foreground">Customer Support Agent</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs hidden md:inline-flex">
            FastAPI + LangGraph + RAG
          </Badge>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="size-9 flex items-center justify-center rounded-lg border border-border hover:border-primary/40 hover:bg-primary/10 transition-colors"
          >
            {theme === 'dark'
              ? <Sun className="size-4 text-muted-foreground" />
              : <Moon className="size-4 text-muted-foreground" />}
          </button>

          <a
            href="https://github.com/alihaider678"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
          >
            <GitBranch className="size-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <a
            href="https://www.linkedin.com/in/ali-haider-ai-engineer/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
          >
            <ExternalLink className="size-4" />
            <span className="hidden sm:inline">LinkedIn</span>
          </a>
        </div>
      </div>
    </motion.header>
  )
}