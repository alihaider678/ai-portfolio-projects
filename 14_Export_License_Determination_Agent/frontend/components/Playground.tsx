"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Globe, Loader2, AlertTriangle, ShieldCheck, ShieldAlert, ShieldX,
  Sparkles, KeyRound, Wand2,
} from "lucide-react";
import {
  checkLicense, getCountries, getHealth,
  type CheckResult, type Outcome, type CountryOption,
} from "@/lib/api";
import { useApiKey } from "./ApiKeyProvider";
import ReasoningFlow from "./ReasoningFlow";

const EXAMPLES: { product: string; country: string; note: string }[] = [
  { product: "men's cotton t-shirt", country: "Germany", note: "ordinary goods, allied country" },
  { product: "ordinary laptop computer", country: "Russia", note: "plain product, restricted country" },
  { product: "end-to-end encryption software", country: "France", note: "controlled product, allied country" },
  { product: "datacenter AI training GPU", country: "China", note: "controlled × restricted" },
  { product: "night-vision goggles", country: "Iran", note: "embargoed destination" },
];

const OUTCOME_META: Record<string, { icon: React.ElementType; cls: string; blurb: string }> = {
  NOT_REQUIRED: { icon: ShieldCheck, cls: "out-clear", blurb: "No export license required on these grounds." },
  LICENSE_REQUIRED: { icon: ShieldAlert, cls: "out-required", blurb: "An export license is required before shipping." },
  PROHIBITED: { icon: ShieldX, cls: "out-prohibited", blurb: "Export is prohibited (presumption of denial)." },
};

export default function Playground() {
  const [product, setProduct] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [serverHasKey, setServerHasKey] = useState(true);
  const { apiKey, hasKey, setDialogOpen } = useApiKey();

  useEffect(() => {
    getCountries().then(setCountries);
    getHealth().then((h) => h && setServerHasKey(h.server_has_key));
  }, []);

  async function run(p = product, c = country) {
    if (!p.trim() || !c.trim()) return;
    setProduct(p); setCountry(c);
    setLoading(true); setError(""); setResult(null);
    try {
      setResult(await checkLicense({ product: p, country: c, apiKey }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const needKeyBanner = !serverHasKey && !hasKey;

  return (
    <section id="try" className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-8">
        <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--accent)" }}>
          Try it
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-strong)] mt-2">Ask the agent</h2>
        <p className="text-[var(--text-muted)] mt-3 max-w-xl mx-auto">
          Enter a product and a destination. The agent checks both dimensions and returns a decision
          with its full reasoning.
        </p>
      </div>

      {needKeyBanner && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border p-3 text-sm"
          style={{ background: "var(--warn-soft)", borderColor: "var(--warn-bd)", color: "var(--warn)" }}>
          <KeyRound className="w-4 h-4 shrink-0" />
          <span className="text-[var(--text)]">Add your OpenAI key to enable the LLM classifier.</span>
          <button onClick={() => setDialogOpen(true)}
            className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold text-white grad-bg">
            Add key
          </button>
        </div>
      )}

      {/* Inputs */}
      <div className="card rounded-2xl p-5">
        <div className="grid sm:grid-cols-2 gap-3">
          <Labeled icon={Package} label="Product / technology">
            <input value={product} onChange={(e) => setProduct(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
              placeholder="e.g. encryption software"
              className="field w-full px-3.5 py-2.5 rounded-xl text-sm" />
          </Labeled>
          <Labeled icon={Globe} label="Destination country">
            <input value={country} onChange={(e) => setCountry(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
              list="lg-countries" placeholder="e.g. China"
              className="field w-full px-3.5 py-2.5 rounded-xl text-sm" />
            <datalist id="lg-countries">
              {countries.map((c) => <option key={c.name} value={c.name} />)}
            </datalist>
          </Labeled>
        </div>

        <button onClick={() => run()} disabled={loading || !product.trim() || !country.trim()}
          className="mt-3 w-full px-6 py-3 rounded-xl font-semibold text-white grad-bg glow disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 spin" /> : <Wand2 className="w-4 h-4" />}
          {loading ? "Running the agent…" : "Determine license requirement"}
        </button>

        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-xs text-[var(--text-faint)] py-1">Examples:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex.product + ex.country} onClick={() => run(ex.product, ex.country)}
              title={ex.note}
              className="chip text-xs px-2.5 py-1 rounded-lg">
              {ex.product} → {ex.country}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-sm rounded-xl p-3 border"
          style={{ background: "var(--stop-soft)", borderColor: "var(--stop-bd)", color: "var(--stop)" }}>
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {result && !loading && <Result r={result} />}
      </AnimatePresence>
    </section>
  );
}

function Labeled({ icon: Icon, label, children }: {
  icon: React.ElementType; label: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] mb-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} /> {label}
      </label>
      {children}
    </div>
  );
}

function Result({ r }: { r: CheckResult }) {
  const meta = OUTCOME_META[r.outcome as string] ?? OUTCOME_META.LICENSE_REQUIRED;
  const Icon = meta.icon;
  const cs = r.country_status;
  const pc = r.product_classification;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="mt-6 space-y-4">
      {/* Verdict */}
      <div className={`rounded-2xl border p-5 ${meta.cls}`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0"
            style={{ borderColor: "currentColor" }}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-bold display leading-tight">{r.outcome_label}</div>
            <div className="text-sm opacity-90 mt-0.5">{meta.blurb}</div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Tag>scrutiny: {r.decision.scrutiny}</Tag>
              <Tag>{r.decision.driver}-driven</Tag>
              <Tag>{r.product} → {r.country}</Tag>
            </div>
          </div>
        </div>
      </div>

      {/* Two dimensions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Dimension title="Destination check" level={cs.level} levelClass={`lvl-${cs.level}`}
          heading={cs.country} sub={cs.program ?? "No country-based embargo"} note={cs.note} />
        <Dimension title="Product check" level={pc.control_level} levelClass={`ctl-${pc.control_level}`}
          heading={pc.category_name} sub={pc.ccl_reference ? `CCL ${pc.ccl_reference}` : ""}
          note={pc.reasoning} extra={pc.confidence ? `${pc.confidence} confidence` : ""} />
      </div>

      {/* Triggers */}
      {r.decision.triggers.length > 0 && (
        <div className="card rounded-2xl p-5">
          <div className="text-sm font-semibold text-[var(--text-strong)] mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: "var(--accent)" }} /> What triggered this
          </div>
          <div className="space-y-2">
            {r.decision.triggers.map((t, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 mt-0.5 uppercase"
                  style={{ borderColor: "var(--border-strong)", color: "var(--accent)" }}>{t.type}</span>
                <span className="text-[var(--text-muted)]">{t.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="card rounded-2xl p-5">
        <div className="text-sm font-semibold text-[var(--text-strong)] mb-2">Plain-English determination</div>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">{r.explanation}</p>
      </div>

      {/* Reasoning trace */}
      <ReasoningFlow trace={r.trace} outcome={r.outcome as Outcome} />

      <p className="text-xs text-[var(--text-faint)] text-center px-4">
        Guidance only — a portfolio demo on curated public data. Confirm real classifications with a
        licensed export-compliance professional.
      </p>
    </motion.div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border"
      style={{ borderColor: "currentColor", opacity: 0.85 }}>{children}</span>
  );
}

function Dimension({ title, level, levelClass, heading, sub, note, extra }: {
  title: string; level: string; levelClass: string; heading: string;
  sub: string; note: string; extra?: string;
}) {
  return (
    <div className="card rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-[var(--text-muted)]">{title}</span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${levelClass}`}>{level}</span>
      </div>
      <div className="font-semibold text-[var(--text-strong)] leading-snug">{heading}</div>
      {sub && <div className="text-xs font-mono text-[var(--text-faint)] mt-0.5">{sub}</div>}
      {note && <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">{note}</p>}
      {extra && <div className="text-[11px] text-[var(--text-faint)] mt-2">{extra}</div>}
    </div>
  );
}