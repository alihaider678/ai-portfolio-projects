'use client'

import { motion } from 'framer-motion'
import { Activity, Sun, Moon, GitBranch, ExternalLink } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

export default function Header() {
  const { theme, toggle } = useTheme()

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 border-b border-border glass"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Activity className="size-4 text-primary" />
          </div>
          <div>
            <span className="font-bold text-sm text-foreground">MediTriage</span>
            <span className="hidden sm:inline text-xs text-muted-foreground ml-2">AI</span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Live Demo
          </span>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          {['Features', 'How It Works', 'Demo', 'FAQ'].map(item => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(' ', '-')}`}
              className="hover:text-foreground transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/alihaider678"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
          >
            <GitBranch className="size-3.5" />
            GitHub
            <ExternalLink className="size-3" />
          </a>
          <button
            onClick={toggle}
            className="size-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </div>
    </motion.header>
  )
}