import React, { useEffect, useState } from "react";
import { Search, Filter } from "lucide-react";
import { api, DrugCoverageResult } from "../api/client";
import StatusBadge from "../components/StatusBadge";

const STATUS_OPTIONS = [
  { value: "", label: "Any status" },
  { value: "covered", label: "Covered" },
  { value: "requires_pa", label: "Requires PA" },
  { value: "restricted", label: "Restricted" },
  { value: "not_covered", label: "Not covered" },
  { value: "investigational", label: "Investigational" },
];

export default function DrugSearch() {
  const [query, setQuery] = useState("");
  const [payer, setPayer] = useState("");
  const [status, setStatus] = useState("");
  const [payers, setPayers] = useState<string[]>([]);
  const [results, setResults] = useState<DrugCoverageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listPayers().then(setPayers).catch(() => setPayers([]));
  }, []);

  const searchDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await api.searchDrug(query.trim(), payer || undefined, status || undefined);
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
        <h1>Drug Search</h1>
        <p>Find coverage rules for a drug across payers.</p>
      </div>

      <form onSubmit={searchDrug} className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="two-col">
            <div className="form-group">
              <label>Drug name</label>
              <div className="search-bar">
                <Search size={18} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Botox, OnabotulinumtoxinA"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Filters</label>
              <div className="two-col" style={{ gap: 12 }}>
                <select className="form-control" value={payer} onChange={(e) => setPayer(e.target.value)}>
                  <option value="">All payers</option>
                  {payers.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="state-box"><div className="spinner" /></div>
      ) : results.length === 0 ? (
        <div className="state-box">
          <Filter size={28} />
          <h3>No results yet</h3>
          <p>Run a search to see coverage rules.</p>
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
                <th>Tier</th>
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
                  <td>{r.coverage_tier ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
