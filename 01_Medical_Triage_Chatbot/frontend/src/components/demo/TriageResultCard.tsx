'use client'

import { motion } from 'framer-motion'
import { AlertCircle, Clock, CheckCircle2, ChevronRight, Shield, Siren } from 'lucide-react'
import type { TriageLevel } from '@/lib/types'

const CONFIG: Record<TriageLevel, {
  label: string
  headline: string
  icon: React.ElementType
  color: string
  rgb: string
}> = {
  emergency: {
    label: 'EMERGENCY',
    headline: 'Seek immediate emergency care',
    icon: Siren,
    color: '#ef4444',
    rgb: '239,68,68',
  },
  urgent: {
    label: 'URGENT',
    headline: 'See a doctor today',
    icon: Clock,
    color: '#f59e0b',
    rgb: '245,158,11',
  },
  routine: {
    label: 'ROUTINE',
    headline: 'Schedule a doctor appointment',
    icon: CheckCircle2,
    color: '#22c55e',
    rgb: '34,197,94',
  },
}

interface Props {
  level: TriageLevel
  conditions: string[]
  recommendations: string[]
}

export default function TriageResultCard({ level, conditions, recommendations }: Props) {
  const cfg = CONFIG[level]
  const Icon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl overflow-hidden border"
      style={{
        borderColor: `rgba(${cfg.rgb},0.35)`,
        boxShadow: `0 4px 32px rgba(${cfg.rgb},0.18), 0 1px 6px rgba(0,0,0,0.15)`,
      }}
    >
      {/* Header bar */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{ background: `rgba(${cfg.rgb},0.14)` }}
      >
        <div
          className="size-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `rgba(${cfg.rgb},0.22)`, border: `1px solid rgba(${cfg.rgb},0.4)` }}
        >
          <Icon className="size-5" style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Triage Assessment
          </p>
          <p className="text-base font-bold leading-tight" style={{ color: cfg.color }}>
            {cfg.label}
          </p>
        </div>
        <span
          className="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
          style={{ background: `rgba(${cfg.rgb},0.12)`, color: cfg.color, border: `1px solid rgba(${cfg.rgb},0.25)` }}
        >
          <span className="size-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
          {cfg.headline}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5" style={{ background: `rgba(${cfg.rgb},0.04)` }}>
        {/* Probable conditions */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Probable Conditions
          </p>
          <div className="space-y-2">
            {conditions.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-center gap-2.5"
              >
                <ChevronRight className="size-3.5 shrink-0" style={{ color: cfg.color }} />
                <span className="text-sm text-foreground capitalize">{c}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px" style={{ background: `rgba(${cfg.rgb},0.18)` }} />

        {/* Recommendations */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Recommended Actions
          </p>
          <div className="space-y-2.5">
            {recommendations.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex items-start gap-3"
              >
                <span
                  className="size-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                  style={{ background: `rgba(${cfg.rgb},0.18)`, color: cfg.color }}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-foreground/85 leading-relaxed">{r}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div
          className="flex items-start gap-2 pt-3 border-t"
          style={{ borderColor: `rgba(${cfg.rgb},0.18)` }}
        >
          <Shield className="size-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
            This is an AI demonstration and NOT a medical diagnosis. Always consult a qualified
            healthcare professional or call emergency services for urgent situations.
          </p>
        </div>
      </div>
    </motion.div>
  )
}