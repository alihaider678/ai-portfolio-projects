"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PlayCircle, Terminal, Plug } from "lucide-react";

// Drop a recording at frontend/public/demo.mp4 to light this up.
const DEMO_SRC = "/demo.mp4";

export default function DemoSection() {
  const [failed, setFailed] = useState(false);

  return (
    <section id="demo" className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-10">
        <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--accent)" }}>
          Demo
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-strong)] mt-2">See it decide</h2>
        <p className="text-[var(--text-muted)] mt-3 max-w-xl mx-auto">
          The LangGraph agent driven over <strong className="text-[var(--text)]">real MCP tool calls</strong> —
          parsing a question, checking both dimensions, and branching to a verdict.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="card glow rounded-3xl overflow-hidden">
        <div className="aspect-video bg-[var(--bg-2)] flex items-center justify-center relative">
          {!failed ? (
            <video controls playsInline preload="metadata" className="w-full h-full object-contain"
              onError={() => setFailed(true)}>
              <source src={DEMO_SRC} type="video/mp4" />
            </video>
          ) : (
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-2xl grad-bg mx-auto flex items-center justify-center mb-4">
                <PlayCircle className="w-8 h-8 text-white" />
              </div>
              <div className="font-semibold text-[var(--text-strong)]">Demo video coming soon</div>
              <p className="text-sm text-[var(--text-faint)] mt-1 max-w-sm mx-auto">
                A screen recording of the LangGraph agent calling the MCP tools, with LangSmith tracing.
              </p>
            </div>
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-3 p-5 border-t">
          <Feature icon={Plug} title="LangGraph → MCP"
            body="The graph's country/product nodes call the licenseguard MCP server's tools over stdio." />
          <Feature icon={Terminal} title="Auditable output"
            body="Every node, tool result and the final branch is printed — the same trace the web UI renders." />
        </div>
      </motion.div>
    </section>
  );
}

function Feature({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "var(--accent-soft)" }}>
        <Icon className="w-4.5 h-4.5" style={{ color: "var(--accent)" }} />
      </div>
      <div>
        <div className="text-sm font-semibold text-[var(--text-strong)]">{title}</div>
        <div className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{body}</div>
      </div>
    </div>
  );
}