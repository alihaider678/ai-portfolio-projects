import type { RiskLevel } from "@/lib/api";

const CLASS: Record<string, string> = { LOW: "risk-low", MEDIUM: "risk-medium", HIGH: "risk-high" };

export default function RiskBadge({ risk }: { risk: RiskLevel | string | null | undefined }) {
  if (!risk) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${CLASS[risk] ?? "chip"}`}>
      <span className={`w-1.5 h-1.5 rounded-full dot-${risk.toLowerCase()}`} />
      {risk}
    </span>
  );
}