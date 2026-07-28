import { Wallet } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: "var(--border)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg grad-bg flex items-center justify-center">
            <Wallet className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-[var(--text-strong)] text-sm">WalletAssist</span>
        </div>
        <p className="text-xs text-[var(--text-faint)] max-w-2xl leading-relaxed">
          Portfolio demonstration project. Not affiliated with, endorsed by, or built on behalf of
          Keenu / Wemsol Pvt Ltd. The FAQ content used for grounding is real and publicly published
          on Keenu&apos;s own help page; all account and transaction data is entirely synthetic.
          This is not a production support system.
        </p>
      </div>
    </footer>
  );
}