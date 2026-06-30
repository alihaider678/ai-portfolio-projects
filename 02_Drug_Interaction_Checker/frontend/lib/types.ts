export interface PatientProfile {
  age: number | null; // null = not provided; omitted from payload so backend uses default (40)
  renal_impairment: boolean;
  hepatic_impairment: boolean;
  pregnant: boolean;
  conditions: string[];
}

export interface AnalyzeRequest {
  drugs: string[];
  patient_profile: PatientProfile;
  api_key: string;
}

export type JobStatus = "pending" | "running" | "complete" | "failed";

export interface EvidenceSource {
  pmid: string;
  url: string;
}

export type SeverityLevel =
  | "contraindicated"
  | "severe"
  | "moderate"
  | "minor"
  | "none"
  | "unknown";

export interface PairResult {
  drug_a: string;
  drug_b: string;
  severity: SeverityLevel;
  evidence_level: "A" | "B" | "C";
  mechanism: string;
  clinical_effects: string;
  management: string;
  patient_adjustments: string;
  evidence_sources: EvidenceSource[];
  confidence: number;
  cached: boolean;
}

export interface AnalysisResult {
  overall_risk: "HIGH" | "MODERATE" | "LOW" | "NONE";
  risk_label: string;
  severity_counts: Record<string, number>;
  clinical_summary: string;
  total_pairs: number;
  pair_results: PairResult[];
  drugs: string[];
}

export interface JobResponse {
  job_id: string;
  status: JobStatus;
  drugs: string[];
  result?: AnalysisResult;
  pdf_url?: string;
  error?: string;
}

export interface SubmitResponse {
  job_id: string;
  status: string;
  request_id: string;
  pairs: number;
  message: string;
}