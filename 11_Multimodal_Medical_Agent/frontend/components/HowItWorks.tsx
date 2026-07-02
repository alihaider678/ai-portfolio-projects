"use client";

import { motion } from "framer-motion";
import { FileImage, Mic, Eye, AlertTriangle, Volume2, Brain, Upload, Search, Layers } from "lucide-react";

const flows = [
  {
    title: "Prescription Reader",
    color: "cyan",
    steps: [
      { icon: FileImage, label: "Photo or Voice", desc: "Upload prescription image or record audio" },
      { icon: Eye, label: "GPT-4o Vision / Whisper", desc: "AI reads handwriting or transcribes speech" },
      { icon: AlertTriangle, label: "Drug Interaction Check", desc: "Calls Project 02 live API on Render" },
      { icon: Volume2, label: "Spoken Warning", desc: "TTS delivers clinical summary as audio" },
    ],
  },
  {
    title: "PDF Ingestion",
    color: "purple",
    steps: [
      { icon: Upload, label: "Upload PDF", desc: "Medical procedure guide with embedded images" },
      { icon: Eye, label: "PyMuPDF + GPT-4o", desc: "Extracts text & describes diagrams in words" },
      { icon: Layers, label: "ChromaDB Index", desc: "Stores (text + image) pairs as linked chunks" },
      { icon: Brain, label: "Vector Embeddings", desc: "OpenAI embeddings enable semantic search" },
    ],
  },
  {
    title: "Multimodal RAG",
    color: "green",
    steps: [
      { icon: Search, label: "Ask a Question", desc: "Natural language medical query" },
      { icon: Brain, label: "Vector Retrieval", desc: "ChromaDB finds best-matching chunks" },
      { icon: FileImage, label: "Image + Text Together", desc: "Returns diagram AND procedure text — not text alone" },
      { icon: Volume2, label: "Spoken Answer", desc: "TTS reads the retrieved procedure aloud" },
    ],
  },
];

const colorMap = {
  cyan: { border: "border-cyan-500/30", dot: "bg-cyan-400", line: "bg-cyan-500/20", badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25", icon: "from-cyan-500 to-blue-600" },
  purple: { border: "border-violet-500/30", dot: "bg-violet-400", line: "bg-violet-500/20", badge: "bg-violet-500/10 text-violet-400 border-violet-500/25", icon: "from-violet-500 to-purple-600" },
  green: { border: "border-emerald-500/30", dot: "bg-emerald-400", line: "bg-emerald-500/20", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25", icon: "from-emerald-500 to-teal-600" },
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 relative">
      <div className="absolute inset-0 medical-grid opacity-30" />
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-4">
            <span className="text-xs text-cyan-400 font-medium tracking-wider uppercase">Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--tx-heading)] mb-3">
            How It <span className="gradient-text-cyan">Works</span>
          </h2>
          <p className="text-[var(--tx-3)] max-w-xl mx-auto">Three independent AI pipelines built as microservices — connected through a shared knowledge base and unified TTS layer.</p>
        </motion.div>

        <div className="space-y-10">
          {flows.map((flow, fi) => {
            const c = colorMap[flow.color as keyof typeof colorMap];
            return (
              <motion.div
                key={flow.title}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: fi * 0.1 }}
                className={`glass-card rounded-3xl p-6 sm:p-8 border ${c.border}`}
              >
                <div className="flex items-center gap-3 mb-7">
                  <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${c.badge}`}>
                    Capability {String(fi + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg font-bold text-[var(--tx-heading)]">{flow.title}</h3>
                </div>

                <div className="relative">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {flow.steps.map((step, si) => (
                      <div key={si} className="relative">
                        {/* Connector */}
                        {si < flow.steps.length - 1 && (
                          <div className={`hidden sm:block absolute top-6 left-full w-full h-0.5 ${c.line} z-0`} style={{ width: "calc(100% - 48px)", left: "48px" }} />
                        )}

                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: fi * 0.1 + si * 0.08 }}
                          className="flex flex-col items-center text-center gap-3 relative z-10"
                        >
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.icon} flex items-center justify-center shadow-lg`}>
                            <step.icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--tx-heading)]">{step.label}</p>
                            <p className="text-xs text-[var(--tx-4)] mt-1 leading-relaxed">{step.desc}</p>
                          </div>
                          <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                        </motion.div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Microservices callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mt-10 p-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-[var(--tx-heading)] font-semibold">Microservices Architecture</p>
            <p className="text-[var(--tx-3)] text-sm mt-1">
              Prescription Reader calls <span className="text-cyan-400 font-mono text-xs">rxsafe-ai-backend.onrender.com</span> — Project 02&apos;s live drug interaction API — rather than rebuilding that logic. Two independent deployed services, communicating via REST. This is real-world system design.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}