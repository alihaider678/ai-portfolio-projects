import type { AnalyzeRequest, JobResponse, SubmitResponse } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export async function submitAnalysis(
  payload: AnalyzeRequest
): Promise<SubmitResponse> {
  // Strip null fields from patient_profile — backend uses model defaults for omitted fields
  const cleanPatient = Object.fromEntries(
    Object.entries(payload.patient_profile).filter(([, v]) => v !== null)
  );
  const body = { ...payload, patient_profile: cleanPatient };

  const res = await fetch(`${API_BASE}/api/v1/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    const detail = Array.isArray(err.detail)
      ? err.detail.map((e: { msg: string }) => e.msg).join("; ")
      : err.detail || `HTTP ${res.status}`;
    throw new Error(String(detail));
  }

  return res.json();
}

export async function pollJob(jobId: string): Promise<JobResponse> {
  const res = await fetch(`${API_BASE}/api/v1/jobs/${jobId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function getReportUrl(jobId: string): string {
  return `${API_BASE}/api/v1/jobs/${jobId}/report`;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/health`);
    return res.ok;
  } catch {
    return false;
  }
}