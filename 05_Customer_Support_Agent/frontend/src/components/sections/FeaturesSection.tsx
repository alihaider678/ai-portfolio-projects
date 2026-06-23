'use client'

import { motion } from 'framer-motion'
import { Brain, GitFork, AlertTriangle, Zap, Database, Cpu } from 'lucide-react'

const FEATURES = [
  {
    icon: GitFork,
    num: '01',
    title: 'LangGraph Orchestration',
    description: 'Stateful multi-node agent workflow with conditional routing — sentiment drives the execution path.',
    tag: 'LangGraph 0.2+',
    accent: '#22d3ee',
    rgb: '34,211,238',
  },
  {
    icon: Brain,
    num: '02',
    title: 'RAG Architecture',
    description: 'ChromaDB vector store with OpenAI embeddings. Retrieves the top-4 most relevant knowledge base chunks per query.',
    tag: 'ChromaDB + GPT-4o',
    accent: '#a78bfa',
    rgb: '167,139,250',
  },
  {
    icon: AlertTriangle,
    num: '03',
    title: 'Smart Escalation',
    description: 'Detects frustration via GPT-4o. Auto-escalates with unique case IDs and fires a Celery notification task.',
    tag: 'Sentiment NLP',
    accent: '#fb923c',
    rgb: '251,146,60',
  },
  {
    icon: Zap,
    num: '04',
    title: 'Streaming Responses',
    description: 'Server-Sent Events stream tokens from FastAPI in real time — ChatGPT-style progressive rendering.',
    tag: 'SSE / FastAPI',
    accent: '#fbbf24',
    rgb: '251,191,36',
  },
  {
    icon: Database,
    num: '05',
    title: 'Redis Session Memory',
    description: 'Persistent conversation history and sentiment counters in Redis. Sessions survive server restarts with 24h TTL.',
    tag: 'Redis + Upstash',
    accent: '#34d399',
    rgb: '52,211,153',
  },
  {
    icon: Cpu,
    num: '06',
    title: 'Celery Background Jobs',
    description: 'Async KB document ingestion and escalation notifications via Celery workers — non-blocking upload API.',
    tag: 'Celery 5.3+',
    accent: '#f87171',
    rgb: '248,113,113',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
}

export default function FeaturesSection() {
  return (
    <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Ambient center glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_40%,oklch(0.71_0.143_215_/_5%)_0%,transparent_65%)]" />

      <div className="max-w-7xl mx-auto relative">
        {/* Section header */}
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
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            What&apos;s Under the Hood
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Every layer is purpose-built for production — not just demo quality.
          </p>
        </motion.div>

        {/* Cards grid */}
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
                style={{
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 8px 32px rgba(${f.rgb},0.18), 0 1px 3px rgba(0,0,0,0.12)`
                  e.currentTarget.style.borderColor = `rgba(${f.rgb},0.4)`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'
                  e.currentTarget.style.borderColor = ''
                }}
              >
                {/* Top accent gradient line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300 opacity-60 group-hover:opacity-100"
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
                    style={{
                      background: `rgba(${f.rgb},0.12)`,
                      border: `1px solid rgba(${f.rgb},0.28)`,
                    }}
                  >
                    <Icon className="size-5.5" style={{ color: f.accent }} />
                  </div>
                  {/* Pulse ring */}
                  <div
                    className="absolute inset-0 rounded-xl scale-100 opacity-0 group-hover:scale-[1.4] group-hover:opacity-100 transition-all duration-500 pointer-events-none"
                    style={{ boxShadow: `0 0 0 4px rgba(${f.rgb},0.15)` }}
                  />
                </div>

                {/* Text */}
                <h3 className="text-base font-semibold mb-2 text-foreground">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {f.description}
                </p>

                {/* Tech tag */}
                <div
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    background: `rgba(${f.rgb},0.1)`,
                    color: f.accent,
                    border: `1px solid rgba(${f.rgb},0.22)`,
                  }}
                >
                  <span
                    className="size-1.5 rounded-full animate-pulse"
                    style={{ background: f.accent }}
                  />
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