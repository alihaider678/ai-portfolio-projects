'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQItem {
  tag: string
  tagColor: string
  q: string
  a: string
}

const FAQS: FAQItem[] = [
  {
    tag: 'Privacy',
    tagColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    q: 'Is my OpenAI API key stored anywhere?',
    a: 'No — never. Your API key is used exclusively for your live session and is never persisted to any database, log, or server-side storage. This is the BYOK (Bring Your Own Key) pattern: the key travels from your browser directly to OpenAI\'s API for each request, then disappears. You can verify this by inspecting the network tab — no key is ever sent to our backend storage layer.',
  },
  {
    tag: 'Privacy',
    tagColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    q: 'Where is my conversation data stored?',
    a: 'Conversations are stored in Redis with a 24-hour TTL (time-to-live). After 24 hours, all session messages and sentiment counters are automatically purged. Each session is keyed by a UUID generated on your device — no personally identifiable information is attached. You can also manually wipe your session at any time using the "Clear session" button in the chat panel.',
  },
  {
    tag: 'Capabilities',
    tagColor: 'bg-primary/10 text-primary border-primary/20',
    q: 'Does this chatbot support multimodal inputs — images or audio?',
    a: 'Not in the current version. The agent is text-only: it accepts typed messages and retrieves context from text chunks stored in ChromaDB. Multimodal support is architecturally possible — GPT-4o natively supports vision inputs, and audio could be routed through OpenAI Whisper for transcription before entering the LangGraph pipeline. These would be the next natural extensions.',
  },
  {
    tag: 'Capabilities',
    tagColor: 'bg-primary/10 text-primary border-primary/20',
    q: 'What file types can I upload to the knowledge base?',
    a: 'PDF and TXT files are supported. PDFs are parsed with PyPDFLoader and TXT files with TextLoader. Both are then split into 1,000-character chunks with 150-character overlap using LangChain\'s RecursiveCharacterTextSplitter. Each chunk is embedded with OpenAI\'s text-embedding-3-small model and stored in ChromaDB. On each query, the top-4 most semantically similar chunks are retrieved and injected into the GPT-4o prompt.',
  },
  {
    tag: 'Capabilities',
    tagColor: 'bg-primary/10 text-primary border-primary/20',
    q: 'How accurate are the responses? Can the agent hallucinate?',
    a: 'Responses are grounded in your uploaded knowledge base via RAG, which significantly reduces hallucination compared to a plain LLM call. However, if the answer to a question is not present in any uploaded document, GPT-4o may extrapolate or decline to answer. The retrieval step fetches the top-4 chunks by cosine similarity — if none are relevant, the model is instructed to say it doesn\'t know rather than guess.',
  },
  {
    tag: 'Architecture',
    tagColor: 'bg-accent/10 text-accent border-accent/20',
    q: 'How does the escalation system work under the hood?',
    a: 'Every message is classified by GPT-4o into one of four sentiments: positive, neutral, negative, or frustrated. If the result is negative or frustrated, a counter stored in Redis increments. Once it reaches the threshold (default: 2), LangGraph\'s conditional edge routes to the escalation node instead of the RAG node. That node generates a unique case ID, fires a Celery background task to notify the support team, and streams a human-handoff message — all without blocking the HTTP response.',
  },
  {
    tag: 'Architecture',
    tagColor: 'bg-accent/10 text-accent border-accent/20',
    q: 'Why use LangGraph instead of a simple LangChain chain?',
    a: 'A standard LangChain chain is linear — it can\'t branch. LangGraph models the agent as a stateful directed graph with conditional edges, so the sentiment result determines which node executes next: respond or escalate. This also makes the system extensible — adding a new capability (e.g., billing lookup, ticket creation) means adding a node and an edge, not rewriting the chain. LangGraph also persists state across nodes, which is essential for passing the API key and session context through the full workflow.',
  },
  {
    tag: 'Architecture',
    tagColor: 'bg-accent/10 text-accent border-accent/20',
    q: 'Can this be deployed to production?',
    a: 'Yes. The FastAPI backend is fully containerizable — a standard Dockerfile would run it on AWS ECS, GCP Cloud Run, or Fly.io. Redis would move to a managed service like AWS ElastiCache or Upstash. ChromaDB can be swapped for Pinecone or Weaviate for production-scale vector search. The Celery workers would run as separate container replicas. The Next.js frontend deploys to Vercel in one command. The main production consideration is securing the BYOK flow over HTTPS and adding rate limiting per session.',
  },
]

function FAQRow({ item, index }: { item: FAQItem; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border-b border-border last:border-0"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left hover:text-primary transition-colors group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border shrink-0', item.tagColor)}>
            {item.tag}
          </span>
          <span className="text-base font-medium leading-snug">{item.q}</span>
        </div>
        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground shrink-0 transition-transform duration-300',
            open && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-base text-muted-foreground leading-relaxed pr-8">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQSection() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Common questions from users, developers, and interviewers — answered honestly.
          </p>
        </motion.div>

        <div className="rounded-2xl border border-border overflow-hidden px-6 sm:px-8">
          {FAQS.map((item, i) => (
            <FAQRow key={item.q} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}