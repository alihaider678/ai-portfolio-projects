'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'Is this a replacement for real medical advice?',
    a: 'No. This is an AI demonstration tool built for a portfolio showcase. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional, and call 911 for emergencies.',
    tag: 'Disclaimer',
    tagColor: '#f87171',
  },
  {
    q: 'How accurate is the AI triage?',
    a: 'The AI uses GPT-4o combined with a curated medical knowledge base (RAG) and follows a conservative escalation rule — when in doubt, it recommends a higher urgency level. In testing, it correctly identifies emergency conditions like cardiac symptoms and stroke criteria. However, accuracy cannot be guaranteed and should never replace a doctor.',
    tag: 'Accuracy',
    tagColor: '#fbbf24',
  },
  {
    q: 'How does the multi-turn interview work?',
    a: 'LangGraph powers a stateful interview graph. Each user message passes through an interview node (GPT-4o-mini extracts symptom data and generates the next question), then a completeness check node that decides whether enough information has been gathered. Once 4 key data points are collected — main symptom, duration, severity, and associated symptoms — the graph switches to triage mode.',
    tag: 'Architecture',
    tagColor: '#a78bfa',
  },
  {
    q: 'What is RAG and why is it used here?',
    a: 'RAG (Retrieval-Augmented Generation) means the AI retrieves relevant documents from a knowledge base before generating a response. Instead of relying solely on the LLM\'s training data, the triage analysis is grounded in 21 clinical documents covering emergency, urgent, and routine conditions — improving accuracy and reducing hallucinations.',
    tag: 'Architecture',
    tagColor: '#a78bfa',
  },
  {
    q: 'What symptoms can the assistant assess?',
    a: 'The knowledge base covers cardiac events, stroke, severe allergic reactions, respiratory distress, head trauma, meningitis, severe abdominal pain, overdose (emergency), as well as high fever, UTI, ear infections, wounds, hypertension, severe headache (urgent), and common cold, minor injuries, back pain, and mild GI issues (routine).',
    tag: 'Capabilities',
    tagColor: '#34d399',
  },
  {
    q: 'Which AI model powers this?',
    a: 'Two OpenAI models are used. GPT-4o-mini handles the interview questions (up to 8 turns) for speed and cost efficiency. GPT-4o performs the final triage analysis — the critical decision that determines emergency vs. urgent vs. routine.',
    tag: 'Tech Stack',
    tagColor: '#22d3ee',
  },
  {
    q: 'How is my conversation data handled?',
    a: 'Session data (your messages and collected symptoms) is stored in Upstash Redis with a 24-hour expiry. Your OpenAI API key is sent directly from the browser to the FastAPI backend and is never logged or persisted. No personal health data is retained after the session expires.',
    tag: 'Privacy',
    tagColor: '#34d399',
  },
  {
    q: 'Do I need my own OpenAI API key?',
    a: 'Yes — this project uses a Bring-Your-Own-Key (BYOK) model. You enter your OpenAI API key in the demo interface. It\'s sent securely to the backend for each request and never stored. This is intentional: it demonstrates professional API key management and keeps demo costs fair.',
    tag: 'BYOK',
    tagColor: '#fb923c',
  },
]

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-xs text-primary font-medium mb-5">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Common Questions
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked</h2>
          <p className="text-muted-foreground">Everything you need to know about the AI triage system.</p>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${faq.tagColor}18`, color: faq.tagColor, border: `1px solid ${faq.tagColor}30` }}
                  >
                    {faq.tag}
                  </span>
                  <span className="text-sm font-medium text-foreground truncate">{faq.q}</span>
                </div>
                <ChevronDown
                  className="size-4 text-muted-foreground shrink-0 transition-transform duration-300"
                  style={{ transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}