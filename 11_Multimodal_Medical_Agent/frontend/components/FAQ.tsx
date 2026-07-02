"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is this safe to use for real patient prescriptions?",
    a: "This is a portfolio demonstration project. It uses real AI models (GPT-4o Vision, Whisper) and real drug interaction data from an external API. However, it is NOT a certified medical device and should not replace licensed pharmacist review or clinical judgment. Always verify AI output with a qualified healthcare professional.",
  },
  {
    q: "Where are my API keys stored?",
    a: "Nowhere on the server. This project uses BYOK (Bring Your Own Key) security. Your OpenAI and ElevenLabs keys travel only in the HTTP request body and are discarded immediately after use. They are never written to disk, database, Redis, or logs. You can inspect the source code to verify this.",
  },
  {
    q: "What is the difference between OpenAI TTS and ElevenLabs?",
    a: "OpenAI TTS (tts-1-hd, Alloy voice) is fast, reliable, and uses your existing OpenAI key — no extra account needed. ElevenLabs (Rachel voice, Multilingual v2) offers studio-quality voice synthesis with more natural prosody. ElevenLabs requires a separate account and API key, available on a free trial tier.",
  },
  {
    q: "What types of prescription images work best?",
    a: "GPT-4o Vision can read both handwritten and printed prescriptions. Good lighting, minimal blur, and a flat surface help significantly. It works with photos taken on a phone camera, scanned images (PNG/JPG), and HEIC files from iPhone. It handles Latin abbreviations (bid, tid, qid, prn) correctly.",
  },
  {
    q: "How does the multimodal RAG work differently from regular RAG?",
    a: "Standard RAG returns only text chunks. MedAI Nexus returns image + text together as linked pairs. When a PDF page has an embedded diagram, GPT-4o Vision generates a text description of that diagram. Both the page text and the image description are embedded together and stored with the raw image bytes. When you query, you get the diagram AND the procedure text — not one or the other.",
  },
  {
    q: "What happens when I upload a PDF — does it get stored anywhere?",
    a: "The PDF itself is only held in memory during parsing and is not saved to disk. The extracted text, image descriptions, and image bytes are stored in a local ChromaDB vector database (a folder on the server). The ChromaDB data persists across server restarts so you do not need to re-upload documents each time.",
  },
  {
    q: "Why does it call Project 02's API instead of checking interactions directly?",
    a: "This demonstrates real-world microservices architecture. Project 02 (RxSafe AI) is a separately deployed drug interaction service with its own API. Project 11 calls that live service rather than duplicating the logic — the same pattern used in production systems where different teams own different services. It also showcases portfolio breadth: two projects working together.",
  },
  {
    q: "Can I upload my own medical documents beyond the sample PDFs?",
    a: "Yes. Any PDF with text and/or embedded images can be uploaded via the PDF Knowledge Base tab. After ingestion, those documents are immediately queryable. The system handles multi-page PDFs with multiple images per page. The only limit is your OpenAI API rate limits, since image description requires GPT-4o Vision calls during ingestion.",
  },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="glass-card rounded-xl border-[var(--bd-1)] overflow-hidden"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-5 text-left group"
      >
        <span className={`text-sm font-semibold transition-colors ${open ? "text-cyan-300" : "text-[var(--tx-1)] group-hover:text-[var(--tx-heading)]"}`}>
          {q}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-[var(--tx-4)] transition-transform duration-300 ${open ? "rotate-180 text-cyan-400" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 text-[var(--tx-3)] text-sm leading-relaxed border-t border-[var(--bd-1)] pt-4">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  return (
    <section id="faq" className="py-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--bd-2)] bg-[var(--surf-1)] mb-4">
            <span className="text-xs text-[var(--tx-3)] font-medium tracking-wider uppercase">FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--tx-heading)] mb-3">
            Common <span className="gradient-text-cyan">Questions</span>
          </h2>
          <p className="text-[var(--tx-3)]">Everything you need to know about MedAI Nexus</p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}