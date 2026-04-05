import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, Pill, ScanSearch, FolderCog, FilePlus2,
  Search, ShieldCheck, CheckCircle2, AlertCircle, Clock, Sparkles,
} from "lucide-react";
import Layout from "../components/Layout";
import { api, PayerSummary } from "../api/client";

export default function Dashboard() {
  const navigate = useNavigate();
  const [payers, setPayers] = useState<string[]>([]);
  const [policies, setPolicies] = useState<PayerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listPayers()
      .then(async (p) => {
        setPayers(p);
        const all = await Promise.all(p.map(name => api.payerPolicies(name).catch(() => [])));
        setPolicies(all.flat());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalDocs   = policies.length;
  const totalDrugs  = [...new Set(policies.flatMap(p => p.drugs))].length;
  const totalRules  = policies.reduce((s, p) => s + p.rule_count, 0);

  return (
    <Layout>
      <div className="hero-card">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Coverage Intelligence Dashboard</h1>
          <p>Track extracted policies, drill into coverage rules, and jump into searches.</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navigate("/upload")}>
              <FilePlus2 size={16} /> Upload policy
            </button>
            <button className="btn btn-outline" onClick={() => navigate("/drug")}>
              <Search size={16} /> Search drugs
            </button>
          </div>
        </div>
        <div className="hero-badge">
          <Sparkles size={16} />
          <span>{loading ? "Loading model…" : "LLM pipeline ready"}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div><p>Total Policies</p><h2>{loading ? "—" : totalDocs}</h2></div>
          <FileText size={34} />
        </div>
        <div className="stat-card green">
          <div><p>Unique Drugs</p><h2>{loading ? "—" : totalDrugs}</h2></div>
          <Pill size={34} />
        </div>
        <div className="stat-card orange">
          <div><p>Coverage Rules</p><h2>{loading ? "—" : totalRules}</h2></div>
          <ScanSearch size={34} />
        </div>
        <div className="stat-card purple">
          <div><p>Payers Loaded</p><h2>{loading ? "—" : payers.length}</h2></div>
          <FolderCog size={34} />
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: 24 }}>
        {/* Policies table */}
        <div className="card">
          <div className="card-header"><h3>Loaded Policies</h3></div>
          <div className="table-wrap">
            {loading ? (
              <div className="state-box"><div className="spinner" /></div>
            ) : policies.length === 0 ? (
              <div className="state-box">
                <FileText size={36} />
                <h3>No policies loaded</h3>
                <p>Upload a PDF to get started.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Payer</th>
                    <th>Policy ID</th>
                    <th>Drugs</th>
                    <th>Rules</th>
                    <th>Effective</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{p.payer_name ?? "—"}</td>
                      <td><code className="muted-code">{p.policy_id ?? "—"}</code></td>
                      <td>{p.drug_count}</td>
                      <td>{p.rule_count}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{p.effective_date ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="card-header"><h3>Quick Actions</h3></div>
          <div className="card-body">
            <div className="quick-actions">
              {[
                { icon: <FilePlus2 size={28} />, label: "Upload Policy",      path: "/upload",     color: "#0f766e" },
                { icon: <Search size={28} />,    label: "Search Drugs",        path: "/drug",       color: "#0f172a" },
                { icon: <ShieldCheck size={28}/>, label: "PA Requirements",   path: "/pa",         color: "#b45309" },
                { icon: <ScanSearch size={28} />, label: "Payer Comparison",  path: "/compare",    color: "#5b21b6" },
              ].map(a => (
                <button key={a.path} onClick={() => navigate(a.path)} className="quick-action" style={{ color: a.color }}>
                  {a.icon}
                  <span className="quick-action-label">{a.label}</span>
                </button>
              ))}
            </div>

            {/* Payer list */}
            {payers.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>Payers in Database</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {payers.map(p => (
                    <span key={p} className="badge badge-blue">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="card-header"><h3>Getting Started</h3></div>
        <div className="card-body">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: <CheckCircle2 size={16} style={{ color: "var(--green)" }} />, text: "Upload a UHC or Aetna PDF using the Upload Policy page." },
              { icon: <CheckCircle2 size={16} style={{ color: "var(--green)" }} />, text: "The AI pipeline extracts drugs, coverage rules, and ICD-10 codes automatically." },
              { icon: <AlertCircle  size={16} style={{ color: "var(--amber)" }} />, text: "Search by drug name, indication, or ICD-10 code using the search pages." },
              { icon: <Clock        size={16} style={{ color: "var(--accent)" }} />, text: "Use Payer Comparison to see how coverage differs across insurers side-by-side." },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "var(--text-muted)" }}>
                <div style={{ flexShrink: 0, marginTop: 1 }}>{item.icon}</div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
