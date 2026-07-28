import { BookOpen, Search, HelpCircle, UserRound } from "lucide-react";

export default function BentoFeatures() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="max-w-2xl mb-8">
        <div className="eyebrow text-xs font-bold tracking-widest uppercase" style={{ color: "var(--accent)" }}>
          What it actually does
        </div>
        <h2 className="mt-2 text-3xl font-extrabold text-[var(--text-strong)]">Four judgment calls, not one script</h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel lg:col-span-2 lg:row-span-2 p-7 flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--accent-soft)" }}>
              <BookOpen className="w-5 h-5" style={{ color: "var(--accent)" }} />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-strong)]">Grounded in real product knowledge</h3>
            <p className="mt-2.5 text-sm text-[var(--text-muted)] leading-relaxed">
              Every general question — bill splitting, top-ups, transaction limits — is answered
              from Keenu&apos;s actual public FAQ content, retrieved with hybrid BM25 + semantic
              search, not made up by the model.
            </p>
          </div>
          <div className="mt-6 flex gap-2 flex-wrap">
            <span className="chip text-[11px] px-3 py-1">38 real Q&amp;A pairs</span>
            <span className="chip text-[11px] px-3 py-1">Chroma + BM25 fusion</span>
          </div>
        </div>

        <div className="panel p-6">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--ok-soft)" }}>
            <Search className="w-5 h-5" style={{ color: "var(--ok)" }} />
          </div>
          <h3 className="font-bold text-[var(--text-strong)]">Checks your actual transaction</h3>
          <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
            &quot;Why did my payment fail?&quot; triggers a real lookup — success, pending, or a
            specific failure reason — not a generic apology.
          </p>
        </div>

        <div className="panel p-6">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(96,165,250,.14)" }}>
            <HelpCircle className="w-5 h-5" style={{ color: "#60a5fa" }} />
          </div>
          <h3 className="font-bold text-[var(--text-strong)]">Knows when to ask</h3>
          <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
            No transaction ID and no account selected? It asks a follow-up instead of guessing
            which transaction you mean.
          </p>
        </div>

        <div className="panel lg:col-span-2 p-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "var(--accent2-soft)" }}>
            <UserRound className="w-6 h-6" style={{ color: "var(--accent-2)" }} />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-strong)]">Honest about its limits</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed">
              Disputed charges, fraud reports, active device compromise — flagged for a human
              support agent immediately, never pretended to be resolved by a bot.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}