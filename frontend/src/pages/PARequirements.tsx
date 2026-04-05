import React, { useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import { api, PARequirementResult } from "../api/client";
import StatusBadge from "../components/StatusBadge";

export default function PARequirements() {
  const [drug, setDrug] = useState("");
  const [results, setResults] = useState<PARequirementResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drug.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await api.paRequirements(drug.trim());
      setResults(res);
    } catch (err: any) {
      setError(err.message ?? "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>PA Requirements</h1>
        <p>See prior authorization requirements and criteria by payer.</p>
      </div>

      <form onSubmit={runSearch} className="card" style={{ marginBottom: 16 }}>
        <div className="card-body two-col">
          <div className="form-group">
            <label>Drug name</label>
            <div className="search-bar">
              <Search size={18} />
              <input
                value={drug}
                onChange={(e) => setDrug(e.target.value)}
                placeholder="e.g., Botox"
                required
              />
            </div>
          </div>
          <div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      </form>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="state-box"><div className="spinner" /></div>
      ) : results.length === 0 ? (
        <div className="state-box">
          <ClipboardList size={28} />
          <h3>No results yet</h3>
          <p>Search for a drug to view payer-specific PA rules.</p>
        </div>
      ) : (
        results.map((r, i) => (
          <div key={i} className="result-card">
            <div className="result-card-header">
              <div>
                <h4>{r.drug_name}</h4>
                <p>{r.payer_name ?? "Unknown payer"} — {r.policy_id ?? "No policy ID"}</p>
              </div>
              <StatusBadge status={r.pa_required ? "requires_pa" : "covered"} />
            </div>
            <div className="result-meta">
              <span className="meta-chip">Indication: {r.indication_name ?? "—"}</span>
              <span className="meta-chip">Approval days: {r.approval_duration_days ?? "—"}</span>
            </div>
            {r.criteria?.length > 0 && (
              <ul className="criteria-list">
                {r.criteria.map((c, idx) => <li key={idx}>{c}</li>)}
              </ul>
            )}
            {r.step_therapy?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <strong style={{ fontSize: 13 }}>Step therapy:</strong>
                <ul className="criteria-list">
                  {r.step_therapy.map((c, idx) => <li key={idx}>{c}</li>)}
                </ul>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
