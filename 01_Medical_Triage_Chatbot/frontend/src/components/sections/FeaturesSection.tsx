'use client'

import { motion } from 'framer-motion'
import { GitFork, Database, Cpu, LayoutList, MemoryStick, ShieldCheck } from 'lucide-react'

const FEATURES = [
  {
    icon: GitFork,
    num: '01',
    title: 'LangGraph Interview Agent',
    description:
      'Stateful multi-node graph with conditional routing — completeness check gates the interview before triggering triage analysis.',
    tag: 'LangGraph 0.2+',
    accent: '#22d3ee',
    rgb: '34,211,238',
  },
  {
    icon: Database,
    num: '02',
    title: 'Medical RAG Knowledge Base',
    description:
      'ChromaDB vector store seeded with 21 clinical documents covering emergency, urgent, and routine conditions. Semantic top-4 retrieval.',
    tag: 'ChromaDB + MiniLM',
    accent: '#a78bfa',
    rgb: '167,139,250',
  },
  {
    icon: Cpu,
    num: '03',
    title: 'Dual-Model Pipeline',
    description:
      'GPT-4o-mini handles the lightweight interview turns for speed and cost; GPT-4o performs the critical final triage analysis.',
    tag: 'GPT-4o + GPT-4o-mini',
    accent: '#fb923c',
    rgb: '251,146,60',
  },
  {
    icon: LayoutList,
    num: '04',
    title: 'Structured Triage Output',
    description:
      'Pydantic-enforced JSON response — triage level, probable conditions, and ranked action recommendations. Never free-form text.',
    tag: 'Structured JSON',
    accent: '#34d399',
    rgb: '52,211,153',
  },
  {
    icon: MemoryStick,
    num: '05',
    title: 'Redis Session Memory',
    description:
      'Full symptom state persisted in Upstash Redis across conversation turns. Sessions survive server restarts with 24h TTL.',
    tag: 'Redis + Upstash',
    accent: '#fbbf24',
    rgb: '251,191,36',
  },
  {
    icon: ShieldCheck,
    num: '06',
    title: 'Safety-First Design',
    description:
      'Conservative escalation logic — uncertain cases escalate to a higher urgency level. Built-in medical disclaimer on every response.',
    tag: 'Clinical Safety',
    accent: '#f87171',
    rgb: '248,113,113',
  },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_40%,oklch(0.72_0.155_195_/_5%)_0%,transparent_65%)]" />

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
            6 Production-Grade Components
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">What&apos;s Under the Hood</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Every layer purpose-built for clinical accuracy and production reliability.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                variants={item}
                whileHover={{ y: -7, transition: { duration: 0.22 } }}
                className="group relative rounded-2xl border border-border bg-card p-6 overflow-hidden cursor-default"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)', transition: 'box-shadow 0.3s ease, border-color 0.3s ease' }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = `0 8px 32px rgba(${f.rgb},0.18), 0 1px 3px rgba(0,0,0,0.12)`
                  e.currentTarget.style.borderColor = `rgba(${f.rgb},0.4)`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'
                  e.currentTarget.style.borderColor = ''
                }}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent 0%, ${f.accent} 40%, ${f.accent} 60%, transparent 100%)` }}
                />

                {/* Hover glow blob */}
                <div
                  className="absolute -top-10 -left-10 size-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-2xl"
                  style={{ background: `rgba(${f.rgb},0.1)` }}
                />

                {/* Corner number */}
                <span className="absolute top-4 right-5 font-mono text-xs text-muted-foreground/25 group-hover:text-muted-foreground/50 transition-colors duration-300 select-none">
                  {f.num}
                </span>

                {/* Icon */}
                <div className="relative mb-5 w-fit">
                  <div
                    className="size-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `rgba(${f.rgb},0.12)`, border: `1px solid rgba(${f.rgb},0.28)` }}
                  >
                    <Icon className="size-5" style={{ color: f.accent }} />
                  </div>
                  <div
                    className="absolute inset-0 rounded-xl scale-100 opacity-0 group-hover:scale-[1.4] group-hover:opacity-100 transition-all duration-500 pointer-events-none"
                    style={{ boxShadow: `0 0 0 4px rgba(${f.rgb},0.15)` }}
                  />
                </div>

                <h3 className="text-base font-semibold mb-2 text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{f.description}</p>

                <div
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: `rgba(${f.rgb},0.1)`, color: f.accent, border: `1px solid rgba(${f.rgb},0.22)` }}
                >
                  <span className="size-1.5 rounded-full animate-pulse" style={{ background: f.accent }} />
                  {f.tag}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}