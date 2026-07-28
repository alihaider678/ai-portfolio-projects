const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010/api";

export type PathTaken = "faq" | "tool" | "escalation" | "clarification";

export interface Account {
  account_id: string;
  display_name: string;
  transaction_count: number;
}

export interface RetrievedFaq {
  category: string;
  question: string;
  answer: string;
  fusion_score: number;
}

export interface TransactionResult {
  transaction_id: string;
  account_id: string;
  method: string;
  biller: string | null;
  amount: number;
  currency: string;
  status: "success" | "failed" | "pending";
  reason_code: string | null;
  reason_text: string | null;
  occurred_at: string;
}

export interface ChatResponse {
  session_id: string;
  response: string;
  intent: string;
  path_taken: PathTaken;
  retrieved_faqs: RetrievedFaq[] | null;
  transaction_result: TransactionResult | null;
}

export interface Health {
  status: string;
  agent_ready: boolean;
  knowledge_base_loaded: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJSON<T>(path: string, retries = 0): Promise<T | null> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${API_BASE}${path}`, { signal: AbortSignal.timeout(15000) });
      if (res.ok) return res.json();
      if (res.status < 500 || attempt >= retries) return null;
    } catch {
      if (attempt >= retries) return null;
    }
    await sleep(3000);
  }
}

export const getHealth = () => getJSON<Health>("/health");

export async function getAccounts(): Promise<Account[]> {
  const data = await getJSON<{ accounts: Account[] }>("/accounts", 8);
  return data?.accounts ?? [];
}

export interface ChatArgs {
  sessionId: string;
  message: string;
  accountId?: string;
  apiKey?: string;
  useDemoKey?: boolean;
}

export async function sendChat(args: ChatArgs): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: args.sessionId,
      message: args.message,
      account_id: args.accountId ?? null,
      openai_api_key: args.apiKey ?? "",
      use_demo_key: !!args.useDemoKey,
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

export async function getTransactionStatus(transactionId: string): Promise<TransactionResult | null> {
  return getJSON<TransactionResult>(`/transactions/${transactionId}/status`);
}