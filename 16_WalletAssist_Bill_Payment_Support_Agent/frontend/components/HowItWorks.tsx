import { MessageCircle, BookOpen, Search, UserRound, HelpCircle } from "lucide-react";

const OUTCOMES = [
  { key: "faq", label: "FAQ lookup", desc: "General product question", icon: BookOpen, color: "var(--accent)", soft: "var(--accent-soft)", y: 40 },
  { key: "tool", label: "Transaction check", desc: "Account-specific question", icon: Search, color: "var(--ok)", soft: "var(--ok-soft)", y: 200 },
  { key: "escalation", label: "Human handoff", desc: "Dispute or fraud report", icon: UserRound, color: "var(--accent-2)", soft: "var(--accent2-soft)", y: 360 },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
      <div className="max-w-2xl mb-10">
        <div className="eyebrow text-xs font-bold tracking-widest uppercase" style={{ color: "var(--accent)" }}>
          How it works
        </div>
        <h2 className="mt-2 text-3xl font-extrabold text-[var(--text-strong)]">One router, three honest paths</h2>
        <p className="mt-3 text-[var(--text-muted)]">
          Every message is classified first — the agent decides which of three paths fits, rather
          than running a fixed pipeline and narrating whatever comes out.
        </p>
      </div>

      {/* Desktop: SVG-connected flow */}
      <div className="hidden lg:block panel p-8 relative overflow-hidden">
        <svg viewBox="0 0 760 400" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          {OUTCOMES.map((o) => (
            <path key={o.key} d={`M 150,200 C 350,200 350,${o.y} 560,${o.y}`}
              fill="none" stroke="var(--border-strong)" strokeWidth="2" strokeDasharray="5 6" />
          ))}
        </svg>

        <div className="relative grid grid-cols-[auto_1fr] items-center h-full" style={{ minHeight: 400 }}>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10" style={{ left: 20 }}>
            <div className="w-16 h-16 rounded-3xl grad-bg flex items-center justify-center glow">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs font-bold text-[var(--text-strong)]">classify_intent</span>
          </div>

          {OUTCOMES.map((o) => {
            const Icon = o.icon;
            return (
              <div key={o.key} className="absolute flex items-center gap-3 z-10" style={{ right: 20, top: o.y - 24 }}>
                <div className="panel-solid px-4 py-3 flex items-center gap-3 min-w-[220px]">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: o.soft }}>
                    <Icon className="w-5 h-5" style={{ color: o.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-strong)]">{o.label}</div>
                    <div className="text-[11px] text-[var(--text-faint)]">{o.desc}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: simple stacked list */}
      <div className="lg:hidden space-y-3">
        <div className="panel p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl grad-bg flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="text-sm font-bold text-[var(--text-strong)]">Your message is classified first</div>
        </div>
        {[...OUTCOMES, { key: "clarify", label: "Ask a follow-up", desc: "Ambiguous account question, no ID given", icon: HelpCircle, color: "#60a5fa", soft: "rgba(96,165,250,.14)", y: 0 }].map((o) => {
          const Icon = o.icon;
          return (
            <div key={o.key} className="panel p-4 flex items-center gap-3 ml-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: o.soft }}>
                <Icon className="w-5 h-5" style={{ color: o.color }} />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-strong)]">{o.label}</div>
                <div className="text-[11px] text-[var(--text-faint)]">{o.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}