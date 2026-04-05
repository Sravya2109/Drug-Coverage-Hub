import React, { useState } from "react";
import { CloudUpload, FileText, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { api, ExtractionResponse } from "../api/client";
import StatusBadge from "../components/StatusBadge";

function MetaRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text-muted)" }}>
      <strong style={{ width: 120, color: "var(--text)" }}>{label}</strong>
      <span>{value || "—"}</span>
    </div>
  );
}

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractionResponse | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please choose a PDF to upload.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await api.uploadPDF(file);
      setResult(res);
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Upload Policy PDF</h1>
        <p>Run the extraction pipeline and store the result.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={onSubmit} className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>Select PDF</h3>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-outline" type="button" onClick={() => { setFile(null); setResult(null); setError(null); }} disabled={loading}>
              Clear
            </button>
            <button className="btn btn-primary" type="submit" disabled={loading || !file}>
              {loading ? "Uploading..." : "Run Extraction"}
            </button>
          </div>
        </div>
        <div className="card-body two-col" style={{ alignItems: "stretch", gap: 18 }}>
          <label className="drop-zone" style={{ minHeight: 200, justifyContent: "center" }}>
            <CloudUpload size={32} />
            <p style={{ fontSize: 15 }}>Drop a PDF here or <strong>click to browse</strong></p>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Maximum size 25 MB. PDFs only.</p>
            <input
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          <div className="card" style={{ boxShadow: "none", borderColor: "var(--border)", marginBottom: 0 }}>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ShieldCheck size={18} style={{ color: "var(--accent)" }} />
                <div>
                  <strong>Tips</strong>
                  <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Use native text PDFs (not scans). Include payer name and policy ID in the file.</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FileText size={18} style={{ color: "var(--purple)" }} />
                <div>
                  <strong>What you get</strong>
                  <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Normalized JSON with drugs, rules, ICD-10 codes, and metadata saved to MongoDB.</p>
                </div>
              </div>
              {file ? (
                <div className="result-card" style={{ marginBottom: 0, boxShadow: "var(--shadow)" }}>
                  <div className="result-card-header">
                    <div>
                      <h4>{file.name}</h4>
                      <p>{Math.round(file.size / 1024)} KB</p>
                    </div>
                    <span className="badge badge-blue">Ready to upload</span>
                  </div>
                  <div className="result-meta">
                    <span className="meta-chip">Type: PDF</span>
                    <span className="meta-chip">Size: {(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
              ) : (
                <div className="state-box" style={{ padding: 18 }}>
                  <p style={{ color: "var(--text-muted)" }}>No file selected yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      {result && (
        <div className="card">
          <div className="card-header">
            <h3>Extraction Result</h3>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {result.metadata.source_file}
            </span>
          </div>
          <div className="card-body">
            <div className="two-col" style={{ marginBottom: 24 }}>
              <div>
                <h4 style={{ marginBottom: 10 }}>Metadata</h4>
                <MetaRow label="Payer" value={result.metadata.payer_name} />
                <MetaRow label="Policy ID" value={result.metadata.policy_id} />
                <MetaRow label="Policy Type" value={result.metadata.policy_type} />
                <MetaRow label="Effective" value={result.metadata.effective_date} />
              </div>
              <div>
                <h4 style={{ marginBottom: 10 }}>Stats</h4>
                <MetaRow label="Drugs" value={String(result.drugs.length)} />
                <MetaRow label="Coverage Rules" value={String(result.coverage_rules.length)} />
                {result._mongo_id && <MetaRow label="Mongo ID" value={result._mongo_id} />}
                {result._mongo_error && (
                  <div className="error-banner" style={{ marginTop: 8 }}>
                    Mongo error: {result._mongo_error}
                  </div>
                )}
                {result.validation_failed && (
                  <div className="error-banner" style={{ marginTop: 8 }}>
                    Validation failed: {result.validation_errors?.join("; ")}
                  </div>
                )}
              </div>
            </div>

            <h4 style={{ marginBottom: 8 }}>Coverage Rules</h4>
            {result.coverage_rules.length === 0 ? (
              <div className="state-box" style={{ alignItems: "flex-start" }}>
                <AlertTriangle size={24} />
                <p>No coverage rules extracted.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Payer</th>
                      <th>Drug</th>
                      <th>Indication</th>
                      <th>Status</th>
                      <th>PA</th>
                      <th>Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.coverage_rules.map((r, i) => (
                      <tr key={i}>
                        <td>{r.payer_name ?? "—"}</td>
                        <td style={{ fontWeight: 600 }}>{r.drug_name}</td>
                        <td>{r.indication_name ?? "—"}</td>
                        <td><StatusBadge status={r.coverage_status} /></td>
                        <td>{r.pa_required === null ? "—" : r.pa_required ? "Yes" : "No"}</td>
                        <td>{r.coverage_tier ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
