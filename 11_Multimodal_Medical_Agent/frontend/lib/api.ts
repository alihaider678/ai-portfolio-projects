const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8002/api/v1";

export interface ApiKeys {
  openai_api_key: string;
  elevenlabs_api_key: string;
  tts_provider: "openai" | "elevenlabs";
  voice_id: string;
}

// ── Prescription ──────────────────────────────────────────────

export interface PrescriptionResult {
  job_id: string;
}

export interface PrescriptionJob {
  // Backend emits "complete"; keep "completed" too for safety.
  status: "pending" | "running" | "complete" | "completed" | "failed";
  result?: {
    extraction: Record<string, unknown>;
    medications: Array<{ name?: string; dosage?: string; frequency?: string }>;
    drug_names?: string[];
    interaction_result: Record<string, unknown>;
    summary_text: string;
    audio_b64: string;
  };
  error?: string;
}

export async function analyzePrescription(
  file: File,
  inputType: "image" | "audio",
  keys: ApiKeys
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("input_type", inputType);
  form.append("tts_provider", keys.tts_provider);
  form.append("openai_api_key", keys.openai_api_key);
  if (keys.elevenlabs_api_key) form.append("elevenlabs_api_key", keys.elevenlabs_api_key);
  if (keys.voice_id) form.append("voice_id", keys.voice_id);

  const res = await fetch(`${API_BASE}/prescription/analyze`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Prescription analysis failed");
  }
  const data = await res.json();
  return data.job_id as string;
}

export async function pollPrescriptionJob(jobId: string): Promise<PrescriptionJob> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`);
  if (!res.ok) throw new Error("Failed to poll job");
  return res.json();
}

// ── Knowledge Base ────────────────────────────────────────────

export interface IngestResult {
  doc_name: string;
  pages_ingested: number;
  images_found: number;
  total_chunks: number;
}

export async function ingestPDF(file: File, openaiKey: string): Promise<IngestResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("openai_api_key", openaiKey);
  const res = await fetch(`${API_BASE}/knowledge/ingest`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Ingest failed");
  }
  return res.json();
}

export interface QueryResult {
  results: Array<{
    doc_name: string;
    page: number;
    text: string;
    image_b64: string;
    image_descriptions: string;
    distance: number;
  }>;
  spoken_response: string;
  audio_b64: string;
}

export async function queryKnowledge(
  query: string,
  keys: ApiKeys,
  topK = 3
): Promise<QueryResult> {
  const form = new FormData();
  form.append("query", query);
  form.append("top_k", String(topK));
  form.append("tts_provider", keys.tts_provider);
  form.append("openai_api_key", keys.openai_api_key);
  if (keys.elevenlabs_api_key) form.append("elevenlabs_api_key", keys.elevenlabs_api_key);
  if (keys.voice_id) form.append("voice_id", keys.voice_id);

  const res = await fetch(`${API_BASE}/knowledge/query/tts`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Query failed");
  }
  return res.json();
}

export async function listDocuments(openaiKey: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/knowledge/docs?openai_api_key=${encodeURIComponent(openaiKey)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.documents ?? [];
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Audio helpers ─────────────────────────────────────────────

export function base64ToAudioUrl(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: "audio/mpeg" });
  return URL.createObjectURL(blob);
}