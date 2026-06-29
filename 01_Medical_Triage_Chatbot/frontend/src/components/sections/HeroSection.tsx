'use client'

import { motion } from 'framer-motion'
import { Activity, ChevronDown, Stethoscope } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/components/ui/button'

const TRIAGE_LEVELS = [
  { level: 'EMERGENCY', color: '#ef4444', rgb: '239,68,68', dot: '🔴', delay: 0 },
  { level: 'URGENT',    color: '#f59e0b', rgb: '245,158,11', dot: '🟡', delay: 0.1 },
  { level: 'ROUTINE',   color: '#22c55e', rgb: '34,197,94',  dot: '🟢', delay: 0.2 },
]

export default function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-[radial-gradient(ellipse,oklch(0.72_0.155_195_/_8%)_0%,transparent_70%)]" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.06)_0%,transparent_70%)]" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.05)_0%,transparent_70%)]" />
      </div>

      {/* ECG line decoration */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-10">
        <svg viewBox="0 0 1200 120" className="w-full" preserveAspectRatio="none">
          <path
            className="ecg-path"
            d="M0,60 L200,60 L230,60 L240,10 L250,110 L260,60 L280,60 L300,60 L330,60 L340,30 L350,90 L360,60 L380,60 L600,60 L630,60 L640,5 L650,115 L660,60 L680,60 L700,60 L730,60 L740,35 L750,85 L760,60 L780,60 L1200,60"
            fill="none"
            stroke="oklch(0.72 0.155 195)"
            strokeWidth="2"
          />
        </svg>
      </div>

      <div className="relative max-w-5xl mx-auto text-center z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-xs text-primary font-medium mb-8"
        >
          <Stethoscope className="size-3.5" />
          AI-Powered Medical Triage
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight mb-6"
        >
          Know When to{' '}
          <span className="gradient-text">Seek Care</span>
          <br />
          <span className="text-foreground/85">Before You Go</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Describe your symptoms and our AI conducts a structured medical interview,
          cross-references a clinical knowledge base, and delivers an accurate triage
          assessment in seconds.
        </motion.p>

        {/* Triage level badges */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {TRIAGE_LEVELS.map(({ level, color, rgb, dot, delay }) => (
            <motion.div
              key={level}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 + delay }}
              className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold"
              style={{
                borderColor: `rgba(${rgb},0.35)`,
                background: `rgba(${rgb},0.08)`,
                color,
              }}
            >
              <span>{dot}</span>
              {level}
            </motion.div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-3"
        >
          <a href="#demo" className={cn(buttonVariants({ size: 'lg' }), 'gap-2 glow-teal')}>
            <Activity className="size-4" />
            Try Live Demo
          </a>
          <a
            href="https://github.com/alihaider678"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
          >
            View on GitHub
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
          className="mt-16 mx-auto flex flex-col items-center gap-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
        >
          <span className="text-xs">Scroll to explore</span>
          <ChevronDown className="size-4 animate-bounce" />
        </motion.button>
      </div>
    </section>
  )
}