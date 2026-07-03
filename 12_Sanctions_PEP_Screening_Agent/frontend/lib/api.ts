const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010/api";

export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type EntityType = "any" | "person" | "organization";

export interface Match {
  entity_id: string;
  matched_name: string;
  primary_name: string;
  is_alias: boolean;
  schema: string;
  list_type: "sanctions" | "pep";
  source: string;
  programs: string[];
  countries: string[];
  score: number;
  risk_level: RiskLevel;
  confidence: string;
  phonetic_match: boolean;
  explanation: string;
}

export interface ScreenResult {
  query: string;
  entity_type: EntityType;
  overall_risk: RiskLevel;
  match_count: number;
  matches: Match[];
}

export interface BatchResult {
  screened: number;
  risk_summary: Record<RiskLevel, number>;
  results: ScreenResult[];
}

export interface Stats {
  total_entities: number;
  indexed_names: number;
  sanctions_entities: number;
  pep_entities: number;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

export const screen = (name: string, entity_type: EntityType, limit = 5) =>
  post<ScreenResult>("/screen", { name, entity_type, limit });

export const batchScreen = (names: string[], entity_type: EntityType) =>
  post<BatchResult>("/batch-screen", { names, entity_type });

export async function getStats(): Promise<Stats | null> {
  try {
    const res = await fetch(`${API_BASE}/stats`, { signal: AbortSignal.timeout(5000) });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}