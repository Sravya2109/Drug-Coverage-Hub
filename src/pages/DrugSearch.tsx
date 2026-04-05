import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Home,
  FileText,
  Pill,
  Settings,
  Search,
  Check,
  X,
} from "lucide-react";
import logo from "/src/components/logo.svg";
import "../styles/DrugSearch.css";

const BRAND_NAME = "Drug Coverage Hub";

interface CoverageData {
  [key: string]: {
    covered: string[];
    notCovered: string[];
  };
}

const DrugSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDrug, setSelectedDrug] = useState<string | null>(null);

  // Sample drug coverage data
  const drugCoverageData: CoverageData = {
    atorvastatin: {
      covered: ["UnitedHealthcare", "Aetna", "Blue Cross Blue Shield", "Cigna"],
      notCovered: ["Humana"],
    },
    metformin: {
      covered: ["UnitedHealthcare", "Aetna", "Humana", "Cigna"],
      notCovered: ["Blue Cross Blue Shield"],
    },
    lisinopril: {
      covered: [
        "UnitedHealthcare",
        "Blue Cross Blue Shield",
        "Cigna",
        "Aetna",
      ],
      notCovered: ["Humana"],
    },
    omeprazole: {
      covered: ["Aetna", "Blue Cross Blue Shield", "Humana", "Cigna"],
      notCovered: ["UnitedHealthcare"],
    },
    daxxify: {
      covered: ["UnitedHealthcare", "Cigna"],
      notCovered: ["Aetna", "Blue Cross Blue Shield", "Humana"],
    },
    levothyroxine: {
      covered: [
        "UnitedHealthcare",
        "Aetna",
        "Blue Cross Blue Shield",
        "Humana",
        "Cigna",
      ],
      notCovered: [],
    },
    simvastatin: {
      covered: ["UnitedHealthcare", "Aetna", "Cigna"],
      notCovered: ["Blue Cross Blue Shield", "Humana"],
    },
    amoxicillin: {
      covered: ["All Major Insurers"],
      notCovered: [],
    },
  };

  const insuranceCompanies = [
    "UnitedHealthcare",
    "Aetna",
    "Blue Cross Blue Shield",
    "Cigna",
    "Humana",
  ];

  const drugList = Object.keys(drugCoverageData);
  const filteredDrugs = drugList.filter((drug) =>
    drug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDrugSelect = (drug: string) => {
    setSelectedDrug(drug);
    setSearchQuery("");
  };

  const getCoverageData = () => {
    if (!selectedDrug) return null;
    return drugCoverageData[selectedDrug.toLowerCase()];
  };

  const coverageData = getCoverageData();

  return (
    <div className="upload-layout">
      {/* Header with brand */}
      <header className="topbar">
        <div className="brand">
          <img
            src={logo}
            alt={BRAND_NAME}
            className="brand-logo-img"
          />
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

      {/* Content wrapper with sidebar and main */}
      <div className="content-wrapper">
        {/* Sidebar */}
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
              <span>Drug Search</span>
            </button>

            <button className="nav-item" onClick={() => navigate('/settings')}>
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <div className="main-shell">
          <main className="main-content">
            <section className="page-header">
              <h1>Drug Coverage Search</h1>
              <p>
                Search for a drug name to view which insurance companies cover it
                and which ones don't.
              </p>
            </section>

          <section className="drug-search-container">
            {/* Search Section */}
            <div className="search-section">
              <div className="search-box">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search drug name (e.g., atorvastatin, metformin)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              {/* Drug List */}
              {searchQuery && filteredDrugs.length > 0 && (
                <div className="drug-list">
                  {filteredDrugs.map((drug) => (
                    <button
                      key={drug}
                      className={`drug-item ${
                        selectedDrug === drug ? "active" : ""
                      }`}
                      onClick={() => handleDrugSelect(drug)}
                    >
                      <Pill size={16} />
                      <span>{drug.charAt(0).toUpperCase() + drug.slice(1)}</span>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && filteredDrugs.length === 0 && (
                <div className="no-results">
                  <p>No drugs found matching "{searchQuery}"</p>
                </div>
              )}
            </div>

            {/* Coverage Results */}
            {selectedDrug && coverageData && (
              <div className="coverage-results">
                <div className="results-header">
                  <h2>{selectedDrug.charAt(0).toUpperCase() + selectedDrug.slice(1)} Coverage</h2>
                </div>

                <div className="coverage-grid">
                  {/* Covered By Section */}
                  <div className="coverage-card covered">
                    <div className="coverage-title">
                      <Check size={20} className="coverage-icon" />
                      <h3>Covered By ({coverageData.covered.length})</h3>
                    </div>
                    <div className="insurance-list">
                      {coverageData.covered.length > 0 ? (
                        coverageData.covered.map((insurer) => (
                          <div
                            key={insurer}
                            className="insurance-item covered-item"
                          >
                            <Check size={16} className="status-icon" />
                            <span>{insurer}</span>
                          </div>
                        ))
                      ) : (
                        <p className="empty-message">
                          Not covered by any major insurers
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Not Covered By Section */}
                  <div className="coverage-card not-covered">
                    <div className="coverage-title">
                      <X size={20} className="coverage-icon" />
                      <h3>Not Covered By ({coverageData.notCovered.length})</h3>
                    </div>
                    <div className="insurance-list">
                      {coverageData.notCovered.length > 0 ? (
                        coverageData.notCovered.map((insurer) => (
                          <div
                            key={insurer}
                            className="insurance-item not-covered-item"
                          >
                            <X size={16} className="status-icon" />
                            <span>{insurer}</span>
                          </div>
                        ))
                      ) : (
                        <p className="empty-message">
                          Covered by all major insurers
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Coverage Summary Table */}
                <div className="coverage-summary">
                  <h3>Coverage Summary by Insurance Company</h3>
                  <div className="summary-table">
                    <div className="table-header">
                      <div className="table-cell">Insurance Company</div>
                      <div className="table-cell">Coverage Status</div>
                    </div>
                    {insuranceCompanies.map((insurer) => {
                      const isCovered = coverageData.covered.includes(insurer);
                      return (
                        <div key={insurer} className="table-row">
                          <div className="table-cell">{insurer}</div>
                          <div className={`table-cell status ${isCovered ? "covered" : "not-covered"}`}>
                            {isCovered ? (
                              <span className="status-badge covered-badge">
                                <Check size={14} /> Covered
                              </span>
                            ) : (
                              <span className="status-badge not-covered-badge">
                                <X size={14} /> Not Covered
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {!selectedDrug && !searchQuery && (
              <div className="initial-state">
                <Pill size={48} className="initial-icon" />
                <h3>Search for a Drug</h3>
                <p>
                  Start typing a drug name above to view insurance coverage
                  information
                </p>
              </div>
            )}
          </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DrugSearch;
