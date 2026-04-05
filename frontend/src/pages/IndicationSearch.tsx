import React, { useEffect, useState } from "react";
import { Stethoscope, Search } from "lucide-react";
import { api, IndicationResult } from "../api/client";
import StatusBadge from "../components/StatusBadge";

export default function IndicationSearch() {
  const [query, setQuery] = useState("");
  const [payer, setPayer] = useState("");
  const [payers, setPayers] = useState<string[]>([]);
  const [results, setResults] = useState<IndicationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listPayers().then(setPayers).catch(() => setPayers([]));
  }, []);

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await api.searchIndication(query.trim(), payer || undefined);
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
        <h1>Indication Search</h1>
        <p>See which drugs are covered for a condition across payers.</p>
      </div>

      <form onSubmit={runSearch} className="card" style={{ marginBottom: 16 }}>
        <div className="card-body two-col">
          <div className="form-group">
            <label>Indication</label>
            <div className="search-bar">
              <Search size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Cervical dystonia"
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
          <Stethoscope size={28} />
          <h3>No results yet</h3>
          <p>Run a search to see coverage by indication.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Payer</th>
                <th>Policy ID</th>
                <th>Drug</th>
                <th>Indication</th>
                <th>Status</th>
                <th>PA</th>
                <th>Approval Duration</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{r.payer_name ?? "—"}</td>
                  <td><code>{r.policy_id ?? "—"}</code></td>
                  <td style={{ fontWeight: 600 }}>{r.drug_name}</td>
                  <td>{r.indication_name ?? "—"}</td>
                  <td><StatusBadge status={r.coverage_status} /></td>
                  <td>{r.pa_required === null ? "—" : r.pa_required ? "Yes" : "No"}</td>
                  <td>{r.approval_duration_days ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
