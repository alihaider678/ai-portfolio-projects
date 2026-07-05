const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8012/api";

export type Outcome = "NOT_REQUIRED" | "LICENSE_REQUIRED" | "PROHIBITED" | string;

export interface CountryStatus {
  country: string;
  matched: boolean;
  level: "unrestricted" | "partial" | "embargoed" | string;
  program: string | null;
  note: string;
}

export interface ProductClassification {
  product: string;
  control_level: "uncontrolled" | "dual-use" | "controlled" | string;
  category_id: string | null;
  category_name: string;
  ccl_category: string | null;
  ccl_reference: string;
  matched_keywords: string[];
  confidence: string;
  reasoning: string;
}

export interface Trigger {
  type: "country" | "product" | string;
  detail: string;
}

export interface Decision {
  outcome: Outcome;
  outcome_label: string;
  scrutiny: "standard" | "high" | "prohibited" | string;
  driver: "none" | "country" | "product" | "both" | string;
  triggers: Trigger[];
  country_level: string;
  product_level: string;
}

export interface TraceStep {
  step: string;
  title: string;
  detail: string;
  data?: unknown;
}

export interface CheckResult {
  query: string;
  product: string;
  country: string;
  outcome: Outcome;
  outcome_label: string;
  country_status: CountryStatus;
  product_classification: ProductClassification;
  decision: Decision;
  explanation: string;
  trace: TraceStep[];
  error?: string;
}

export interface Stats {
  countries_tracked: number;
  embargoed: number;
  partial: number;
  control_categories: number;
  controlled: number;
  dual_use: number;
}

export interface Health {
  status: string;
  agent_ready: boolean;
  backend: string | null;
  langsmith: boolean;
  server_has_key: boolean;
  error: string | null;
}

export interface CountryOption {
  name: string;
  level: "unrestricted" | "partial" | "embargoed" | string;
}

export interface CheckArgs {
  product?: string;
  country?: string;
  query?: string;
  apiKey?: string;
}

export async function checkLicense(args: CheckArgs): Promise<CheckResult> {
  const res = await fetch(`${API_BASE}/check-license`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_description: args.product ?? "",
      destination_country: args.country ?? "",
      query: args.query ?? "",
      openai_api_key: args.apiKey ?? "",
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail ?? "Request failed");
  }
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

export async function getHealth(): Promise<Health | null> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(5000) });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export async function getCountries(): Promise<CountryOption[]> {
  try {
    const res = await fetch(`${API_BASE}/countries`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data.countries ?? [];
  } catch {
    return [];
  }
}