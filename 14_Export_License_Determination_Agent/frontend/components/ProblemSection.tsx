"use client";

import { motion } from "framer-motion";
import { Globe2, PackageSearch, GitMerge, AlertTriangle } from "lucide-react";

export default function ProblemSection() {
  return (
    <section id="problem" className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20">
      <div className="max-w-2xl">
        <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--accent)" }}>
          The problem
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-strong)] mt-2">
          You can&apos;t just ship it abroad
        </h2>
        <p className="text-[var(--text-muted)] mt-4 leading-relaxed">
          Before exporting software, hardware, or technology internationally, a compliance officer has to
          check <strong className="text-[var(--text)]">two separate government dimensions</strong> — and the
          answer usually depends on how they <em>combine</em>, not either one alone.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-10">
        <Card icon={Globe2} tone="accent"
          title="1 · Is the destination restricted?"
          body="Countries under US sanctions or embargoes — from full comprehensive bans (Cuba, Iran, North Korea, Syria) to targeted, end-use-driven restrictions (Russia, China, Venezuela)."
          foot="Source: OFAC country-based sanctions programs" />
        <Card icon={PackageSearch} tone="accent-2"
          title="2 · Is the product controlled?"
          body="&ldquo;Dual-use&rdquo; goods with potential military or surveillance use — encryption software, advanced chips, night-vision, radar, nuclear/aerospace tech — live on control lists."
          foot="Source: US Commerce Control List (CCL)" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="card rounded-2xl p-6 mt-4 flex flex-col sm:flex-row items-start gap-4">
        <div className="w-11 h-11 rounded-xl grad-bg flex items-center justify-center shrink-0">
          <GitMerge className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-strong)]">The catch: it&apos;s the combination</h3>
          <p className="text-sm text-[var(--text-muted)] mt-1.5 leading-relaxed">
            Ordinary laptops are fine to most countries — but not to one under a tech embargo. Encryption
            software is restricted almost <em>everywhere</em>, regardless of destination. These rules live in
            different databases, change constantly, and getting it wrong risks{" "}
            <span className="inline-flex items-center gap-1 font-medium" style={{ color: "var(--stop)" }}>
              <AlertTriangle className="w-3.5 h-3.5" /> heavy fines or criminal liability
            </span>.
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-3 leading-relaxed">
            <strong className="text-[var(--text)]">LicenseGuard replaces the manual cross-reference:</strong>{" "}
            it takes a plain-English question, checks both dimensions automatically, and explains exactly
            which rule(s) drove the decision.
          </p>
        </div>
      </motion.div>
    </section>
  );
}

function Card({ icon: Icon, title, body, foot, tone }: {
  icon: React.ElementType; title: string; body: string; foot: string; tone: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="card rounded-2xl p-6">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
        style={{ background: "var(--accent-soft)" }}>
        <Icon className="w-5 h-5" style={{ color: `var(--${tone})` }} />
      </div>
      <h3 className="font-semibold text-[var(--text-strong)]">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">{body}</p>
      <div className="text-xs text-[var(--text-faint)] mt-4 pt-3 border-t">{foot}</div>
    </motion.div>
  );
}