const BASE = "/api/v1";

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface DrugCoverageResult {
  payer_name: string | null;
  policy_id: string | null;
  policy_type: string | null;
  effective_date: string | null;
  drug_name: string;
  indication_name: string | null;
  coverage_status: string;
  pa_required: boolean | null;
  step_therapy: string[];
  criteria: string[];
  coverage_tier: string | null;
  approval_duration_days: number | null;
  quantity_limits: string[];
  notes: string | null;
  hcpcs_codes: string[];
}

export interface IndicationResult {
  payer_name: string | null;
  policy_id: string | null;
  effective_date: string | null;
  drug_name: string;
  indication_name: string | null;
  coverage_status: string;
  pa_required: boolean | null;
  step_therapy: string[];
  criteria: string[];
  approval_duration_days: number | null;
}

export interface PARequirementResult {
  payer_name: string | null;
  policy_id: string | null;
  effective_date: string | null;
  drug_name: string;
  indication_name: string | null;
  pa_required: boolean | null;
  criteria: string[];
  step_therapy: string[];
  approval_duration_days: number | null;
}

export interface CrossPayerResult {
  payer_name: string | null;
  policy_id: string | null;
  effective_date: string | null;
  drug_name: string;
  indication_name: string | null;
  coverage_status: string;
  pa_required: boolean | null;
  coverage_tier: string | null;
}

export interface PayerSummary {
  payer_name: string | null;
  policy_id: string | null;
  policy_type: string | null;
  effective_date: string | null;
  drug_count: number;
  rule_count: number;
  drugs: string[];
}

export interface ICD10Result {
  payer_name: string | null;
  policy_id: string | null;
  policy_type: string | null;
  effective_date: string | null;
  drugs: { drug_name: string; hcpcs_codes: string[] }[];
  coverage_rules: DrugCoverageResult[];
  icd10_codes: string[];
}

export interface ExtractionResponse {
  metadata: {
    payer_name: string | null;
    policy_id: string | null;
    policy_type: string;
    effective_date: string | null;
    source_file: string;
  };
  drugs: { drug_name: string; generic_name: string | null; hcpcs_codes: string[] }[];
  coverage_rules: DrugCoverageResult[];
  validation_failed?: boolean;
  validation_errors?: string[];
  _mongo_id?: string;
  _mongo_error?: string;
}

// ── API calls ────────────────────────────────────────────────────────────────

export const api = {
  health: () => request<{ status: string; model: string }>("/health"),

  searchDrug: (name: string, payer?: string, status?: string) => {
    const params = new URLSearchParams({ name });
    if (payer) params.set("payer", payer);
    if (status) params.set("coverage_status", status);
    return request<DrugCoverageResult[]>(`/search/drug?${params}`);
  },

  searchIndication: (name: string, payer?: string) => {
    const params = new URLSearchParams({ name });
    if (payer) params.set("payer", payer);
    return request<IndicationResult[]>(`/search/indication?${params}`);
  },

  searchICD10: (code: string, payer?: string) => {
    const params = new URLSearchParams({ code });
    if (payer) params.set("payer", payer);
    return request<ICD10Result[]>(`/search/icd10?${params}`);
  },

  paRequirements: (drug: string) =>
    request<PARequirementResult[]>(`/search/pa-requirements?drug=${encodeURIComponent(drug)}`),

  comparePayers: (drug: string) =>
    request<CrossPayerResult[]>(`/search/compare?drug=${encodeURIComponent(drug)}`),

  listPayers: () => request<string[]>("/search/payers"),

  payerPolicies: (payer: string) =>
    request<PayerSummary[]>(`/search/payers/${encodeURIComponent(payer)}/policies`),

  uploadPDF: async (file: File): Promise<ExtractionResponse> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE}/extract`, { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail ?? "Upload failed");
    }
    return res.json();
  },
};
