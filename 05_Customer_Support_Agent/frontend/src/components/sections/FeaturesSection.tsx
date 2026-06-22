'use client'

import { motion } from 'framer-motion'
import { Brain, GitFork, AlertTriangle, Zap, Database, Cpu } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const FEATURES = [
  {
    icon: GitFork,
    title: 'LangGraph Orchestration',
    description: 'Stateful multi-node agent workflow with conditional routing — sentiment drives the execution path.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/25',
  },
  {
    icon: Brain,
    title: 'RAG Architecture',
    description: 'ChromaDB vector store with OpenAI embeddings. Retrieves the top-4 most relevant knowledge base chunks per query.',
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/25',
  },
  {
    icon: AlertTriangle,
    title: 'Smart Escalation',
    description: 'Detects frustration via GPT-4o. Auto-escalates with unique case IDs and fires a Celery notification task.',
    color: 'text-orange-500',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/25',
  },
  {
    icon: Zap,
    title: 'Streaming Responses',
    description: 'Server-Sent Events stream tokens from FastAPI in real time — ChatGPT-style progressive rendering.',
    color: 'text-yellow-500',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/25',
  },
  {
    icon: Database,
    title: 'Redis Session Memory',
    description: 'Persistent conversation history and sentiment counters in Redis. Sessions survive server restarts with 24h TTL.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/25',
  },
  {
    icon: Cpu,
    title: 'Celery Background Jobs',
    description: 'Async KB document ingestion and escalation notifications via Celery workers — non-blocking upload API.',
    color: 'text-rose-500',
    bg: 'bg-rose-400/10',
    border: 'border-rose-400/25',
  },
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function FeaturesSection() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            What&apos;s Under the Hood
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Production-grade architecture built with the tools that matter in enterprise AI.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div key={feature.title} variants={cardVariants}>
                <Card className="h-full hover:border-primary/30 hover:shadow-lg transition-all duration-300 p-6">
                  <CardHeader className="p-0">
                    <div className={`size-12 rounded-xl ${feature.bg} border ${feature.border} flex items-center justify-center mb-4`}>
                      <Icon className={`size-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-base font-semibold mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}