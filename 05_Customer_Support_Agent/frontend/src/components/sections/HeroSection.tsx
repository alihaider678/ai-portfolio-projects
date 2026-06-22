'use client'

import { motion } from 'framer-motion'
import { ArrowDown, Zap } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const TECH_STACK = [
  'LangGraph', 'LangChain', 'RAG', 'Redis', 'Celery',
  'GPT-4o', 'FastAPI', 'Next.js 16', 'ChromaDB',
]

export default function HeroSection() {
  const scrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.71_0.143_215_/_10%)_0%,transparent_60%),radial-gradient(ellipse_at_bottom-right,oklch(0.61_0.22_290_/_7%)_0%,transparent_55%),radial-gradient(ellipse_at_bottom-left,rgb(21_41_86_/_20%)_0%,transparent_55%)]" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(oklch(0.71 0.143 215) 1px, transparent 1px), linear-gradient(90deg, oklch(0.71 0.143 215) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/20 text-xs text-primary mb-8"
        >
          <Zap className="size-3" />
          AI-Powered · Streaming · Production-Ready
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-tight"
        >
          Enterprise{' '}
          <span className="gradient-text">Customer Support</span>
          <br />
          Agent
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          An intelligent support system built with LangGraph agentic workflows, RAG-based
          knowledge retrieval, real-time sentiment analysis, and automatic escalation —
          powered by GPT-4o with streaming responses.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {TECH_STACK.map((tech, i) => (
            <motion.div
              key={tech}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.04 }}
            >
              <Badge variant="outline" className="border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                {tech}
              </Badge>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex items-center justify-center gap-4"
        >
          <Button size="lg" onClick={scrollToDemo} className="gap-2 glow-cyan">
            Try Live Demo
            <ArrowDown className="size-4" />
          </Button>
          <a
            href="https://github.com/alihaider678"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
          >
            View Source
          </a>
        </motion.div>
      </div>
    </section>
  )
}