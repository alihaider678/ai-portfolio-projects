const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8011/api";

export type Confidence = "High" | "Medium" | "Low" | string;

export interface Duty {
  duty_general: string;
  duty_other: string;
  duty_from: string;
  note: string;
}

export interface Candidate {
  hts_code: string;
  description: string;
  duty_general: string;
  fusion_score: number;
}

export interface ClassifyResult {
  query: string;
  country: string;
  suggested_hts_code: string;
  hs6: string;
  description: string;
  confidence: Confidence;
  justification: string;
  duty: Duty;
  runner_up_codes: string[];
  candidates: Candidate[];
  error?: string;
}

export interface DutyResult {
  hts_code: string;
  description: string;
  country: string;
  general_duty_rate: string;
  column2_rate: string;
  rate_source_line: string;
  note: string;
  error?: string;
}

export interface Stats {
  total_lines: number;
  indexed_lines: number;
  with_duty_rate: number;
  chapters: number;
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

export const classify = (product: string, top_k = 5) =>
  post<ClassifyResult>("/classify", { product, top_k });

export async function getDuty(hts_code: string): Promise<DutyResult> {
  const res = await fetch(`${API_BASE}/duty/${encodeURIComponent(hts_code)}`);
  if (!res.ok) throw new Error("Duty lookup failed");
  return res.json();
}

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