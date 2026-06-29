'use client'

import { motion } from 'framer-motion'
import { MessageSquare, Brain, Database, ClipboardCheck } from 'lucide-react'

const STEPS = [
  {
    num: '01',
    icon: MessageSquare,
    title: 'Describe Your Symptom',
    description:
      'Tell the assistant your primary complaint in plain language — no medical jargon required.',
    accent: '#22d3ee',
    rgb: '34,211,238',
  },
  {
    num: '02',
    icon: Brain,
    title: 'AI Conducts Interview',
    description:
      'LangGraph orchestrates a structured multi-turn interview — asking about duration, severity, and associated symptoms.',
    accent: '#a78bfa',
    rgb: '167,139,250',
  },
  {
    num: '03',
    icon: Database,
    title: 'Medical KB Analysis',
    description:
      'ChromaDB retrieves the most relevant clinical documents from our medical knowledge base via semantic search.',
    accent: '#34d399',
    rgb: '52,211,153',
  },
  {
    num: '04',
    icon: ClipboardCheck,
    title: 'Triage Result Delivered',
    description:
      'GPT-4o synthesizes your symptoms with retrieved context and returns a structured Emergency, Urgent, or Routine assessment.',
    accent: '#fb923c',
    rgb: '251,146,60',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}
const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_50%,oklch(0.72_0.155_195_/_4%)_0%,transparent_65%)]" />

      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-xs text-primary font-medium mb-5">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Clinical Interview Process
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">How the AI Triages You</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Four structured steps from symptom description to clinical assessment.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative"
        >
          {/* Connector line (desktop only) */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-border to-transparent pointer-events-none" />

          {STEPS.map((step) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.num}
                variants={item}
                className="relative group rounded-2xl border border-border bg-card p-6 text-center hover:border-primary/30 transition-all duration-300"
                style={{ transition: 'box-shadow 0.3s ease' }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = `0 8px 32px rgba(${step.rgb},0.16)`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                {/* Top accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent, ${step.accent}, transparent)` }}
                />

                {/* Step number */}
                <span className="font-mono text-xs text-muted-foreground/30 absolute top-4 right-4 select-none">
                  {step.num}
                </span>

                {/* Icon */}
                <div className="relative mx-auto mb-4 w-fit">
                  <div
                    className="size-14 rounded-2xl flex items-center justify-center mx-auto"
                    style={{ background: `rgba(${step.rgb},0.12)`, border: `1px solid rgba(${step.rgb},0.25)` }}
                  >
                    <Icon className="size-6" style={{ color: step.accent }} />
                  </div>
                  {/* Pulse ring */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 pulse-ring pointer-events-none"
                    style={{ boxShadow: `0 0 0 4px rgba(${step.rgb},0.15)` }}
                  />
                </div>

                <h3 className="font-semibold text-sm mb-2 text-foreground">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}