const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020/api";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type Action = "monitor" | "hold" | "escalate";

export interface Health {
  status: string;
  agent_ready: boolean;
  db: boolean;
  redis: boolean;
}

export interface Stats {
  total_accounts: number;
  total_transactions: number;
  total_investigations: number;
  flagged_count: number;
  flagged_pct: number;
  risk_distribution: Record<string, number>;
}

export interface EvalAccuracy {
  available: boolean;
  evaluated?: number;
  true_positive?: number;
  false_positive?: number;
  false_negative?: number;
  true_negative?: number;
  precision?: number | null;
  recall?: number | null;
}

export interface Account {
  account_id: string;
  display_name: string;
  home_city: string;
  home_country: string;
  transaction_count: number;
  anomaly_count: number;
}

export interface Transaction {
  transaction_id: string;
  account_id: string;
  counterparty_id: string;
  amount: number;
  currency: string;
  method: string;
  city: string;
  country: string;
  device_id: string;
  occurred_at: string;
  is_synthetic_anomaly: boolean;
  anomaly_type: string | null;
}

export interface ReasoningStep {
  node: string;
  summary: string;
  detail?: unknown;
}

export interface Investigation {
  id: string;
  transaction_id: string;
  status: "running" | "complete" | "error";
  risk_level: RiskLevel | null;
  action: Action | null;
  explanation: string | null;
  hypothesis: string | null;
  checks_run: string[];
  reasoning_trail: ReasoningStep[];
  precedent_used: { summary: string; risk_level: string; action: string; similarity: number } | null;
  iterations: number;
  analyst_feedback: "confirmed_fraud" | "false_positive" | null;
  analyst_id: string | null;
  feedback_at: string | null;
  created_at: string;
  completed_at: string | null;
  account_id: string;
  amount: number;
  city: string;
  country: string;
  method: string;
  occurred_at: string;
}

export interface Precedent {
  id: string;
  investigation_id: string;
  account_id: string;
  summary: string;
  risk_level: string;
  action: string;
  created_at: string;
}

async function getJSON<T>(path: string, opts: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: AbortSignal.timeout(8000), ...opts });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const getHealth = () => getJSON<Health>("/health");
export const getStats = () => getJSON<Stats>("/stats");
export const getEvalAccuracy = () => getJSON<EvalAccuracy>("/eval/accuracy");
export const getGraphMermaid = () => getJSON<{ mermaid: string }>("/graph");

export async function getAccounts(): Promise<Account[]> {
  const data = await getJSON<{ accounts: Account[] }>("/accounts");
  return data?.accounts ?? [];
}

export async function getHistory(accountId: string): Promise<Transaction[]> {
  const data = await getJSON<{ account_id: string; transactions: Transaction[] }>(
    `/transactions/history/${accountId}`
  );
  return data?.transactions ?? [];
}

export async function getPrecedents(accountId?: string, limit = 20): Promise<Precedent[]> {
  const qs = new URLSearchParams({ limit: String(limit), ...(accountId ? { account_id: accountId } : {}) });
  const data = await getJSON<{ precedents: Precedent[] }>(`/precedents?${qs}`);
  return data?.precedents ?? [];
}

export async function listInvestigations(opts: { limit?: number; riskLevel?: string; status?: string } = {}): Promise<Investigation[]> {
  const qs = new URLSearchParams();
  qs.set("limit", String(opts.limit ?? 50));
  if (opts.riskLevel) qs.set("risk_level", opts.riskLevel);
  if (opts.status) qs.set("status", opts.status);
  const data = await getJSON<{ investigations: Investigation[] }>(`/investigations?${qs}`);
  return data?.investigations ?? [];
}

export async function getInvestigation(id: string): Promise<Investigation | null> {
  return getJSON<Investigation>(`/investigations/${id}`);
}

export interface InvestigateArgs {
  transactionId: string;
  apiKey?: string;
  useDemoKey?: boolean;
}

export async function investigate(args: InvestigateArgs): Promise<{ investigation_id: string; status: string }> {
  const res = await fetch(`${API_BASE}/transactions/investigate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transaction_id: args.transactionId,
      openai_api_key: args.apiKey ?? "",
      use_demo_key: !!args.useDemoKey,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

// ── Analyst auth (cookie-based) ──────────────────────────────────────────

export async function login(username: string, password: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.ok;
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
}

export async function getSession(): Promise<{ username: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/session`, { credentials: "include", signal: AbortSignal.timeout(5000) });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export async function submitFeedback(investigationId: string, feedback: "confirmed_fraud" | "false_positive"): Promise<boolean> {
  const res = await fetch(`${API_BASE}/investigations/${investigationId}/feedback`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feedback }),
  });
  return res.ok;
}