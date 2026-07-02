"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileImage, Brain, Mic2, Key } from "lucide-react";
import { useApiKeys } from "@/context/ApiKeysContext";
import PrescriptionTab from "./tabs/PrescriptionTab";
import KnowledgeIngestTab from "./tabs/KnowledgeIngestTab";
import KnowledgeQueryTab from "./tabs/KnowledgeQueryTab";
import ApiKeysModal from "./ApiKeysModal";

const TABS = [
  {
    id: "prescription",
    icon: FileImage,
    label: "Prescription Reader",
    short: "Rx Reader",
    desc: "Image or voice → drug check → spoken warning",
    color: "cyan",
    gradient: "from-cyan-500 to-blue-600",
    activeClass: "border-cyan-500/50 text-cyan-300",
    iconColor: "text-cyan-400",
    glowClass: "glow-cyan",
  },
  {
    id: "ingest",
    icon: Brain,
    label: "PDF Knowledge Base",
    short: "PDF Ingest",
    desc: "Upload medical PDFs with text + diagrams",
    color: "purple",
    gradient: "from-violet-500 to-purple-600",
    activeClass: "border-violet-500/50 text-violet-300",
    iconColor: "text-violet-400",
    glowClass: "glow-purple",
  },
  {
    id: "query",
    icon: Mic2,
    label: "Ask Knowledge Base",
    short: "RAG Query",
    desc: "Ask a question → image + text + voice answer",
    color: "green",
    gradient: "from-emerald-500 to-teal-600",
    activeClass: "border-emerald-500/50 text-emerald-300",
    iconColor: "text-emerald-400",
    glowClass: "glow-green",
  },
];

export default function MainApp() {
  const [activeTab, setActiveTab] = useState("prescription");
  const [modalOpen, setModalOpen] = useState(false);
  const { hasOpenAIKey } = useApiKeys();

  const active = TABS.find(t => t.id === activeTab)!;

  return (
    <section id="app" className="py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--tx-heading)] mb-3">
            Medical AI <span className="gradient-text-cyan">Command Center</span>
          </h2>
          <p className="text-[var(--tx-3)] max-w-xl mx-auto">Three powerful tools in one unified interface. All AI processing runs through your own API keys.</p>
        </motion.div>

        {/* API key warning */}
        {!hasOpenAIKey && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center justify-between p-4 rounded-xl border border-amber-500/30 bg-amber-500/5"
          >
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-amber-300 text-sm font-medium">Configure your API keys to activate all capabilities</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-sm font-medium transition-all shrink-0"
            >
              Set Keys
            </button>
          </motion.div>
        )}

        {/* Tab navigation */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {TABS.map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`relative p-4 rounded-2xl border text-left transition-all ${
                activeTab === tab.id
                  ? `tab-active ${tab.activeClass}`
                  : "border-[var(--bd-1)] bg-[var(--surf-1)] text-[var(--tx-4)] hover:border-[var(--bd-2)] hover:text-[var(--tx-3)]"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tab.gradient} flex items-center justify-center mb-3 ${activeTab === tab.id ? "shadow-lg" : "opacity-60"}`}>
                <tab.icon className="w-4 h-4 text-white" />
              </div>
              <p className="font-semibold text-sm hidden sm:block">{tab.label}</p>
              <p className="font-semibold text-sm sm:hidden">{tab.short}</p>
              <p className="text-xs opacity-60 mt-1 hidden sm:block leading-relaxed">{tab.desc}</p>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r ${tab.gradient}`}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Tab content panel */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card rounded-3xl p-6 sm:p-8"
        >
          {/* Panel header */}
          <div className="flex items-center gap-4 mb-7 pb-5 border-b border-[var(--bd-1)]">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${active.gradient} flex items-center justify-center shadow-lg`}>
              <active.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--tx-heading)]">{active.label}</h3>
              <p className="text-sm text-[var(--tx-4)]">{active.desc}</p>
            </div>
          </div>

          {activeTab === "prescription" && <PrescriptionTab />}
          {activeTab === "ingest" && <KnowledgeIngestTab />}
          {activeTab === "query" && <KnowledgeQueryTab />}
        </motion.div>
      </div>

      <ApiKeysModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}