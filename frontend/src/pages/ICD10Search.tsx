import React, { useEffect, useState } from "react";
import { Activity, Search } from "lucide-react";
import { api, ICD10Result } from "../api/client";
import StatusBadge from "../components/StatusBadge";

export default function ICD10Search() {
  const [code, setCode] = useState("");
  const [payer, setPayer] = useState("");
  const [payers, setPayers] = useState<string[]>([]);
  const [results, setResults] = useState<ICD10Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listPayers().then(setPayers).catch(() => setPayers([]));
  }, []);

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await api.searchICD10(code.trim(), payer || undefined);
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
        <h1>ICD-10 Search</h1>
        <p>Find policies listing a specific ICD-10 diagnosis code.</p>
      </div>

      <form onSubmit={runSearch} className="card" style={{ marginBottom: 16 }}>
        <div className="card-body two-col">
          <div className="form-group">
            <label>ICD-10 code</label>
            <div className="search-bar">
              <Search size={18} />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g., G24.3"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Payer</label>
            <select className="form-control" value={payer} onChange={(e) => setPayer(e.target.value)}>
              <option value="">All payers</option>
              {payers.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
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
          <Activity size={28} />
          <h3>No results yet</h3>
          <p>Search for a code to see matching policies.</p>
        </div>
      ) : (
        results.map((res, idx) => (
          <div key={idx} className="result-card">
            <div className="result-card-header">
              <div>
                <h4>{res.payer_name ?? "Unknown payer"}</h4>
                <p>{res.policy_id ?? "No policy ID"} — {res.effective_date ?? "No date"}</p>
              </div>
              <div className="result-meta">
                <span className="meta-chip">ICD-10: {res.icd10_codes.join(", ")}</span>
                <span className="meta-chip">Drugs: {res.drugs.length}</span>
                <span className="meta-chip">Rules: {res.coverage_rules.length}</span>
              </div>
            </div>
            {res.coverage_rules.map((r, i) => (
              <div key={i} className="result-meta" style={{ marginBottom: 6 }}>
                <strong>{r.drug_name}</strong>
                <StatusBadge status={r.coverage_status} />
                <span className="meta-chip">Indication: {r.indication_name ?? "—"}</span>
                <span className="meta-chip">PA: {r.pa_required === null ? "—" : r.pa_required ? "Yes" : "No"}</span>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
