"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageSquare } from "lucide-react";

const FAQS = [
  {
    q: "What does BYOK mean and why is it important?",
    a: "BYOK (Bring Your Own Key) means you supply your OpenAI API key in the request body. It flows directly through the LangGraph pipeline and is never written to disk, never stored in Redis, and never logged. Your key exists only in memory for the duration of that single request. This is a deliberate security architecture choice — your billing, your control.",
  },
  {
    q: "How do the parallel LangGraph agents work?",
    a: "LangGraph's Send() API fans out to one analyze_pair node per drug combination simultaneously. For 3 drugs, that's 3 parallel agents running at once — each independently querying OpenFDA and PubMed, then calling GPT-4o. Results accumulate via operator.add on the shared state. The synthesis node runs after all pairs complete.",
  },
  {
    q: "What is the agentic research loop?",
    a: "After the initial GPT-4o analysis, if the model returns a confidence score below 0.6, the pipeline automatically fetches 3 more PubMed papers for that drug pair and re-runs the analysis. This repeats up to 2 extra rounds. It's an autonomous decision — the agent decides when it needs more evidence.",
  },
  {
    q: "What data sources does the analysis use?",
    a: "Two real, live public APIs: (1) OpenFDA — the US FDA drug label database, queried at api.fda.gov with 3 fallback query strategies and a 15 QPS semaphore. (2) PubMed E-utilities — NCBI's research paper database, fetching real PMIDs and abstracts with a 3 QPS semaphore. No mock data, no static databases.",
  },
  {
    q: "Why does analysis take up to 60 seconds?",
    a: "Real API calls take real time. OpenFDA queries, PubMed abstract fetches, and GPT-4o inference all have latency. For 3 drugs (3 pairs), each pair independently hits all three sources in parallel — so you're looking at ~10–15s per pair, but they run concurrently. Add PDF generation and the total is typically 30–50 seconds.",
  },
  {
    q: "What is the Redis caching strategy?",
    a: "Each drug pair result is cached in Upstash Redis for 6 hours. The cache key is built from alphabetically sorted drug names (so warfarin+aspirin == aspirin+warfarin). If a pair is cache-hit, it returns immediately with zero API calls. Patient-specific adjustments are excluded from the cache.",
  },
  {
    q: "Is this tool a substitute for clinical advice?",
    a: "No. RxSafe AI is a research and portfolio demonstration tool. While it uses real FDA and PubMed data analyzed by GPT-4o, it has not been validated for clinical decision-making. Always consult a licensed pharmacist or physician before making prescribing decisions.",
  },
  {
    q: "What does the PDF report contain?",
    a: "The ReportLab-generated PDF includes: a cover page with overall risk badge, patient profile table, medication list, full interaction matrix with color-coded severity cells, mechanism and clinical effects for each pair, PubMed reference links, prescriber management recommendations, and a legal disclaimer.",
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 px-6 lg:px-16 bg-[var(--section-bg)] relative overflow-hidden">
      <div className="absolute inset-0 dot-bg opacity-60" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border-col)] bg-[var(--page-bg)] text-sm text-[var(--text-muted)] mb-6">
            <MessageSquare className="w-3.5 h-3.5 text-[var(--accent-col)]" />
            Frequently Asked Questions
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-[var(--text-head)] mb-4">Technical Deep-Dive</h2>
          <p className="text-[var(--text-muted)] text-lg max-w-xl mx-auto">
            Questions about the architecture, APIs, security model, and capabilities — answered.
          </p>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`glass rounded-xl overflow-hidden transition-all duration-300 ${
                open === i ? "border-[var(--accent-col)]/30" : ""
              }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
              >
                <span
                  className={`text-sm font-semibold transition-colors leading-relaxed ${
                    open === i ? "text-[var(--accent-col)]" : "text-[var(--text-body)]"
                  }`}
                >
                  {faq.q}
                </span>
                <motion.div
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="shrink-0"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-colors ${
                      open === i ? "text-[var(--accent-col)]" : "text-[var(--text-muted)]"
                    }`}
                  />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 border-t border-[var(--border-col)]">
                      <p className="text-sm text-[var(--text-muted)] leading-relaxed pt-4">{faq.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}