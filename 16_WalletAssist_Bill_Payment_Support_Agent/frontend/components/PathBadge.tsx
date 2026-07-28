import { BookOpen, Search, UserRound, HelpCircle } from "lucide-react";
import type { PathTaken } from "@/lib/api";

const CONFIG: Record<PathTaken, { label: string; icon: React.ReactNode; className: string }> = {
  faq: { label: "FAQ lookup", icon: <BookOpen className="w-3 h-3" />, className: "badge-faq" },
  tool: { label: "Transaction check", icon: <Search className="w-3 h-3" />, className: "badge-tool" },
  escalation: { label: "Escalated to human", icon: <UserRound className="w-3 h-3" />, className: "badge-escalation" },
  clarification: { label: "Asking for details", icon: <HelpCircle className="w-3 h-3" />, className: "badge-clarify" },
};

export default function PathBadge({ path }: { path: PathTaken }) {
  const cfg = CONFIG[path];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${cfg.className}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}