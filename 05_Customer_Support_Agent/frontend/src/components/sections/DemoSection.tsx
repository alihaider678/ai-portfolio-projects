'use client'

import { motion } from 'framer-motion'
import { MessageSquare, Lightbulb } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import ChatDemo from '@/components/demo/ChatDemo'
import KnowledgeBaseUpload from '@/components/demo/KnowledgeBaseUpload'

const STEPS = [
  { step: '1', text: 'Enter your OpenAI API key above (sk-proj-...)' },
  { step: '2', text: 'Click "Start Session" to initialize a Redis-backed conversation' },
  { step: '3', text: 'Ask anything: "What is your refund policy?"' },
  { step: '4', text: 'Trigger escalation: "I am extremely frustrated with this service!"' },
]

export default function DemoSection() {
  return (
    <section id="demo" className="py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Live Demo</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Use your own OpenAI API key. Watch responses stream in real time and test
            the escalation system.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
          {/* Left — info panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* KB Upload */}
            <KnowledgeBaseUpload />

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="size-5 text-primary" />
                <h3 className="text-base font-semibold">How it works</h3>
              </div>
              <ol className="space-y-4">
                {STEPS.map((s) => (
                  <li key={s.step} className="flex items-start gap-3">
                    <span className="size-6 rounded-full bg-primary/10 border border-primary/30 text-sm text-primary flex items-center justify-center shrink-0 mt-0.5 font-medium">
                      {s.step}
                    </span>
                    <span className="text-sm text-muted-foreground leading-relaxed">{s.text}</span>
                  </li>
                ))}
              </ol>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="size-5 text-primary" />
                <h3 className="text-base font-semibold">Architecture flow</h3>
              </div>
              <div className="space-y-3">
                {[
                  ['Message', 'Redis session lookup → LangGraph workflow'],
                  ['Sentiment', 'GPT-4o classifies: positive / neutral / negative / frustrated'],
                  ['Routing', 'LangGraph conditional edge → respond OR escalate'],
                  ['RAG', 'ChromaDB retrieves top-4 chunks → GPT-4o generates answer'],
                  ['Escalation', 'Unique case ID + Celery notification task fired'],
                  ['Streaming', 'SSE stream → tokens appear word by word'],
                ].map(([label, desc]) => (
                  <div key={label} className="flex gap-2 text-sm">
                    <span className="text-primary font-medium shrink-0 w-20">{label}:</span>
                    <span className="text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right — chat demo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-3"
          >
            <ChatDemo />
          </motion.div>
        </div>
      </div>
    </section>
  )
}