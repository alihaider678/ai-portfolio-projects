import { ShieldAlert } from "lucide-react";
import { GithubIcon } from "./BrandIcons";

export default function Footer() {
  return (
    <footer className="border-t mt-10" style={{ borderColor: "var(--border)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <span className="text-sm font-semibold text-[var(--text-strong)]">TransactionGuard</span>
          <span className="text-xs text-[var(--text-faint)]">· portfolio demo, synthetic data</span>
        </div>
        <a href="https://github.com/alihaider678" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-strong)]">
          <GithubIcon className="w-4 h-4" /> github.com/alihaider678
        </a>
      </div>
    </footer>
  );
}