import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Home,
  FileText,
  Pill,
  Settings,
  Search,
} from "lucide-react";
import logo from "/src/components/logo.svg";
import "../styles/DrugSearch.css";

const BRAND_NAME = "Drug Coverage Hub";

type CoverageStatus = "Covered" | "Partial" | "Not Covered";

interface DrugItem {
  id: number;
  name: string;
  molecule: string;
  manufacturer: string;
  hcpcsCode: string;
  status: CoverageStatus;
  payers: string[];
}

const payerOptions = [
  "All Payers",
  "UnitedHealthcare",
  "Aetna",
  "Blue Cross Blue Shield",
  "Cigna",
  "Humana",
];

const drugsData: DrugItem[] = [
  {
    id: 1,
    name: "Botox",
    molecule: "onabotulinumtoxinA",
    manufacturer: "Tayla",
    hcpcsCode: "J0585",
    status: "Covered",
    payers: ["UnitedHealthcare", "Aetna", "Blue Cross Blue Shield"],
  },
  {
    id: 2,
    name: "Dysport",
    molecule: "abobotulinumtoxinA",
    manufacturer: "Fopla",
    hcpcsCode: "J0586",
    status: "Covered",
    payers: ["UnitedHealthcare", "Cigna"],
  },
  {
    id: 3,
    name: "Xeomin",
    molecule: "incobotulinumtoxinA",
    manufacturer: "Fogla",
    hcpcsCode: "J0588",
    status: "Covered",
    payers: ["UnitedHealthcare", "Aetna", "Cigna"],
  },
  {
    id: 4,
    name: "Myobloc",
    molecule: "rimabotulinumtoxinB",
    manufacturer: "Yarna",
    hcpcsCode: "J0587",
    status: "Partial",
    payers: ["UnitedHealthcare", "Aetna"],
  },
  {
    id: 5,
    name: "Daxxify",
    molecule: "daxibotulinumtoxinA-lanm",
    manufacturer: "Fogna",
    hcpcsCode: "J0589",
    status: "Not Covered",
    payers: ["UnitedHealthcare"],
  },
];

const DrugSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Covered" | "Not Covered" | "Partial"
  >("All");
  const [payerFilter, setPayerFilter] = useState("All Payers");

  const filteredDrugs = useMemo(() => {
    return drugsData.filter((drug) => {
      const matchesSearch =
        `${drug.name} ${drug.molecule} ${drug.hcpcsCode}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ? true : drug.status === statusFilter;

      const matchesPayer =
        payerFilter === "All Payers" ? true : drug.payers.includes(payerFilter);

      return matchesSearch && matchesStatus && matchesPayer;
    });
  }, [searchQuery, statusFilter, payerFilter]);

  const getStatusClass = (status: CoverageStatus) => {
    if (status === "Covered") {
      return "status-covered";
    }
    if (status === "Partial") {
      return "status-partial";
    }
    return "status-not-covered";
  };

  return (
    <div className="upload-layout">
      <header className="topbar">
        <div className="brand">
          <img src={logo} alt={BRAND_NAME} className="brand-logo-img" />
          <span className="brand-text">{BRAND_NAME}</span>
        </div>
        <div className="topbar-right">
          <span className="welcome-text">Welcome, Admin</span>
          <button className="icon-btn" aria-label="Notifications">
            <Bell size={18} />
          </button>
          <div className="user-profile">
            <div className="avatar">
              <span>A</span>
            </div>
            <ChevronDown size={16} />
          </div>
        </div>
      </header>

      <div className="content-wrapper">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <button className="nav-item" onClick={() => navigate("/")}>
              <Home size={18} />
              <span>Dashboard</span>
            </button>

            <button className="nav-item" onClick={() => navigate("/upload")}>
              <FileText size={18} />
              <span>Documents</span>
            </button>

            <button className="nav-item active">
              <Pill size={18} />
              <span>Drugs</span>
            </button>

            <button className="nav-item" onClick={() => navigate("/settings")}>
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </nav>
        </aside>

        <div className="main-shell">
          <main className="main-content">
            <section className="page-header">
              <h1>Drugs Management</h1>
            </section>

            <section className="drugs-management-container">
              <div className="drugs-summary-banner">
                <div className="summary-icon-wrap">
                  <Pill size={26} />
                </div>
                <div>
                  <p>Total Drugs in System</p>
                  <h2>{drugsData.length}</h2>
                </div>
              </div>

              <div className="drugs-filters-card">
                <div className="filters-top-row">
                  <div className="drugs-search-box">
                    <Search size={18} className="search-icon" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by drug name or HCPCS code"
                    />
                  </div>

                  <div className="status-tabs" role="tablist" aria-label="Coverage filters">
                    {(["All", "Covered", "Not Covered", "Partial"] as const).map(
                      (status) => (
                        <button
                          key={status}
                          type="button"
                          className={`status-tab ${statusFilter === status ? "active" : ""}`}
                          onClick={() => setStatusFilter(status)}
                        >
                          {status}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="filters-bottom-row">
                  <div className="sort-label">Drug Name</div>
                  <label className="payer-filter-wrap">
                    <span>Payer</span>
                    <select
                      value={payerFilter}
                      onChange={(event) => setPayerFilter(event.target.value)}
                    >
                      {payerOptions.map((payer) => (
                        <option key={payer} value={payer}>
                          {payer}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="drugs-table-card">
                <div className="drugs-table-header">
                  <div>Drug Name</div>
                  <div>HCPCS Code</div>
                  <div>Coverage Status</div>
                  <div>Payers</div>
                </div>

                {filteredDrugs.length === 0 && (
                  <div className="drugs-empty-state">
                    No drugs match your current filters.
                  </div>
                )}

                {filteredDrugs.map((drug) => (
                  <div key={drug.id} className="drugs-row">
                    <div className="drug-name-cell">
                      <strong>{drug.name}</strong>
                      <span>({drug.molecule})</span>
                      <small>{drug.manufacturer}</small>
                    </div>
                    <div>{drug.hcpcsCode}</div>
                    <div>
                      <span className={`coverage-chip ${getStatusClass(drug.status)}`}>
                        {drug.status}
                      </span>
                    </div>
                    <div className="payers-cell">
                      {drug.payers.map((payer) => (
                        <span key={payer} className="payer-pill">
                          {payer}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DrugSearch;
