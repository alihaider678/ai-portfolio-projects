'use client'

import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import ChatDemo from '@/components/demo/ChatDemo'

export default function DemoSection() {
  return (
    <section id="demo" className="py-24 px-4 sm:px-6 relative">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_60%,oklch(0.72_0.155_195_/_6%)_0%,transparent_65%)]" />

      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-xs text-primary font-medium mb-5">
            <Activity className="size-3.5" />
            Live Interactive Demo
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Try It Yourself</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Enter your OpenAI API key and describe a symptom. The AI will interview you and
            deliver a structured triage assessment in real time.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Chat — takes 3 columns */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3"
          >
            <ChatDemo />
          </motion.div>

          {/* Info panel — takes 2 columns */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 space-y-5"
          >
            {/* Triage levels */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Triage Outcomes
              </p>
              {[
                { emoji: '🔴', level: 'Emergency', desc: 'Life-threatening — call 911 immediately', color: '#ef4444', rgb: '239,68,68' },
                { emoji: '🟡', level: 'Urgent',    desc: 'Serious — see a doctor today',           color: '#f59e0b', rgb: '245,158,11' },
                { emoji: '🟢', level: 'Routine',   desc: 'Non-urgent — schedule an appointment',   color: '#22c55e', rgb: '34,197,94' },
              ].map(t => (
                <div
                  key={t.level}
                  className="flex items-start gap-3 py-3 border-b border-border last:border-0"
                >
                  <span className="text-base">{t.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: t.color }}>{t.level}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Sample prompts */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Sample Symptoms to Try
              </p>
              <div className="space-y-2">
                {[
                  { text: '"I have chest pain and shortness of breath"', level: '🔴' },
                  { text: '"High fever for 3 days and ear pain"',         level: '🟡' },
                  { text: '"Mild headache since this morning"',           level: '🟢' },
                ].map(s => (
                  <div key={s.text} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5">{s.level}</span>
                    <span className="text-muted-foreground italic">{s.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech note */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs text-primary font-medium mb-1">BYOK — Bring Your Own Key</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your OpenAI API key is used directly for each request. It is never stored or
                logged. The key funds your own usage — typically less than $0.02 per full session.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}