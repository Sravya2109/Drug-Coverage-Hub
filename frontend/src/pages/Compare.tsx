import React, { useState } from "react";
import { GitCompare, Search } from "lucide-react";
import { api, CrossPayerResult } from "../api/client";
import StatusBadge from "../components/StatusBadge";

export default function Compare() {
  const [drug, setDrug] = useState("");
  const [results, setResults] = useState<CrossPayerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drug.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await api.comparePayers(drug.trim());
      setResults(res);
    } catch (err: any) {
      setError(err.message ?? "Compare failed");
    } finally {
      setLoading(false);
    }
  };

  // group by payer for nicer table layout
  const grouped = results.reduce<Record<string, CrossPayerResult[]>>((acc, row) => {
    const key = row.payer_name ?? "Unknown";
    acc[key] = acc[key] || [];
    acc[key].push(row);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <h1>Payer Comparison</h1>
        <p>Side-by-side coverage for a drug across payers.</p>
      </div>

      <form onSubmit={runCompare} className="card" style={{ marginBottom: 16 }}>
        <div className="card-body two-col">
          <div className="form-group">
            <label>Drug name</label>
            <div className="search-bar">
              <Search size={18} />
              <input
                value={drug}
                onChange={(e) => setDrug(e.target.value)}
                placeholder="e.g., Myobloc"
                required
              />
            </div>
          </div>
          <div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Comparing..." : "Compare"}
            </button>
          </div>
        </div>
      </form>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="state-box"><div className="spinner" /></div>
      ) : results.length === 0 ? (
        <div className="state-box">
          <GitCompare size={28} />
          <h3>No data yet</h3>
          <p>Run a comparison to see payer coverage for the drug.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Payer</th>
                <th>Indication</th>
                <th>Status</th>
                <th>PA</th>
                <th>Tier</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([payerName, rows]) =>
                rows.map((row, idx) => (
                  <tr key={`${payerName}-${idx}`}>
                    <td style={{ fontWeight: 600 }}>{idx === 0 ? payerName : ""}</td>
                    <td>{row.indication_name ?? "—"}</td>
                    <td><StatusBadge status={row.coverage_status} /></td>
                    <td>{row.pa_required === null ? "—" : row.pa_required ? "Yes" : "No"}</td>
                    <td>{row.coverage_tier ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
