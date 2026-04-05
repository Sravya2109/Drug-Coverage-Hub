import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Home,
  FileText,
  FlaskConical,
  Settings,
  Search,
  Plus,
  Mail,
  Pencil,
  Lock,
  Save,
} from "lucide-react";
import logo from "/src/components/logo.svg";
import "../styles/Settings.css";

const BRAND_NAME = "Drug Coverage Hub";

interface PayerRow {
  name: string;
  abbreviation: string;
  policyFormat: string;
  status: string;
  quarter: string;
  active: boolean;
}

interface PayerFormState {
  name: string;
  abbreviation: string;
  policyFormat: string;
}

const initialPayerRows: PayerRow[] = [
  { name: "UnitedHealthcare", abbreviation: "UHC", policyFormat: "PDF", status: "Uploaded", quarter: "Q2 2026", active: true },
  { name: "Aetna", abbreviation: "AET", policyFormat: "PDF", status: "Uploaded", quarter: "Q2 2026", active: true },
  { name: "Blue Cross Blue Shield", abbreviation: "BCBS", policyFormat: "PDF", status: "Not Uploaded", quarter: "Q2 2026", active: false },
  { name: "Cigna", abbreviation: "CIG", policyFormat: "PDF", status: "Uploaded", quarter: "Q2 2026", active: true },
  { name: "Humana", abbreviation: "HUM", policyFormat: "PDF", status: "Uploaded", quarter: "Q2 2026", active: true },
];

const initialQuarterRows = ["Q1 2026", "Q4 2025", "Q3 2025"];

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [payerRows, setPayerRows] = useState<PayerRow[]>(initialPayerRows);
  const [showAddPayerForm, setShowAddPayerForm] = useState(false);
  const [showAddQuarterForm, setShowAddQuarterForm] = useState(false);
  const [editingPayerIndex, setEditingPayerIndex] = useState<number | null>(null);
  const [addPayerError, setAddPayerError] = useState("");
  const [addQuarterError, setAddQuarterError] = useState("");
  const [payerForm, setPayerForm] = useState<PayerFormState>({
    name: "",
    abbreviation: "",
    policyFormat: "PDF",
  });
  const [quarterRows, setQuarterRows] = useState<string[]>(initialQuarterRows);
  const [activeQuarter, setActiveQuarter] = useState("Q2 2026");
  const [newQuarter, setNewQuarter] = useState({
    quarter: "Q2",
    year: "2026",
  });
  const [profileName, setProfileName] = useState("Admin");
  const [profileEmail, setProfileEmail] = useState("admin@drugcoveragehub.com");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [avatarIndex, setAvatarIndex] = useState(32);
  const avatarUrls = [32, 47, 5, 12, 18];

  const handleAddPayerSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = payerForm.name.trim();
    const abbreviation = payerForm.abbreviation.trim().toUpperCase();

    if (!name || !abbreviation) {
      setAddPayerError("Payer name and abbreviation are required.");
      return;
    }

    const duplicateExists = payerRows.some(
      (payer) =>
        payer.name.toLowerCase() === name.toLowerCase() ||
        payer.abbreviation.toLowerCase() === abbreviation.toLowerCase()
    );

    if (duplicateExists) {
      setAddPayerError("A payer with this name or abbreviation already exists.");
      return;
    }

    const newRow: PayerRow = {
      name,
      abbreviation,
      policyFormat: payerForm.policyFormat,
      status: "Not Uploaded",
      quarter: activeQuarter,
      active: true,
    };

    if (editingPayerIndex === null) {
      setPayerRows((currentRows) => [...currentRows, newRow]);
    } else {
      setPayerRows((currentRows) =>
        currentRows.map((payer, index) => (index === editingPayerIndex ? { ...payer, ...newRow } : payer))
      );
    }

    setPayerForm({ name: "", abbreviation: "", policyFormat: "PDF" });
    setAddPayerError("");
    setShowAddPayerForm(false);
    setEditingPayerIndex(null);
  };

  const handleAddQuarterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const quarterName = `${newQuarter.quarter.trim()} ${newQuarter.year.trim()}`;

    if (!newQuarter.quarter || !newQuarter.year.trim()) {
      setAddQuarterError("Quarter and year are required.");
      return;
    }

    const duplicateExists = quarterRows.some(
      (quarter) => quarter.toLowerCase() === quarterName.toLowerCase()
    );

    if (duplicateExists) {
      setAddQuarterError("This quarter already exists.");
      return;
    }

    setQuarterRows((currentRows) => [quarterName, ...currentRows]);
    setNewQuarter({ quarter: "Q2", year: "2026" });
    setAddQuarterError("");
    setShowAddQuarterForm(false);
    setActiveQuarter(quarterName);
  };

  const handlePayerEdit = (payer: PayerRow, index: number) => {
    setEditingPayerIndex(index);
    setPayerForm({
      name: payer.name,
      abbreviation: payer.abbreviation,
      policyFormat: payer.policyFormat,
    });
    setShowAddPayerForm(true);
    setAddPayerError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTogglePayerActive = (index: number) => {
    setPayerRows((currentRows) =>
      currentRows.map((payer, payerIndex) =>
        payerIndex === index
          ? {
              ...payer,
              active: !payer.active,
            }
          : payer
      )
    );
  };

  const handleCloseQuarter = (quarterName: string) => {
    setQuarterRows((currentRows) => currentRows.filter((quarter) => quarter !== quarterName));
  };

  const handleUploadNewPhoto = () => {
    setAvatarIndex((current) => {
      const currentPosition = avatarUrls.indexOf(current);
      const nextPosition = (currentPosition + 1) % avatarUrls.length;
      return avatarUrls[nextPosition];
    });
  };

  const handleSaveProfile = () => {
    setIsEditingEmail(false);
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

            <button className="nav-item" onClick={() => navigate("/drug-search")}>
              <FlaskConical size={18} />
              <span>Drugs</span>
            </button>

            <button className="nav-item active">
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </nav>
        </aside>

        <div className="main-shell">
          <main className="main-content">
            <section className="page-header">
              <h1>Settings</h1>
            </section>

            <section className="settings-panel settings-payer-panel">
              <div className="settings-panel-header">
                <h3>Payer Management</h3>
                <button
                  className="settings-primary-btn"
                  type="button"
                  onClick={() => {
                    setShowAddPayerForm((show) => !show);
                    setAddPayerError("");
                    setEditingPayerIndex(null);
                    setPayerForm({ name: "", abbreviation: "", policyFormat: "PDF" });
                  }}
                >
                  <Plus size={16} />
                  {showAddPayerForm ? "Cancel" : "Add New Payer"}
                </button>
              </div>

              {showAddPayerForm && (
                <form className="add-payer-form" onSubmit={handleAddPayerSubmit}>
                  <label>
                    <span>Payer Name</span>
                    <input
                      type="text"
                      placeholder="Enter payer name"
                      value={payerForm.name}
                      onChange={(event) =>
                        setPayerForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span>Abbreviation</span>
                    <input
                      type="text"
                      placeholder="e.g. UHC"
                      maxLength={6}
                      value={payerForm.abbreviation}
                      onChange={(event) =>
                        setPayerForm((current) => ({
                          ...current,
                          abbreviation: event.target.value.toUpperCase(),
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span>Policy Format</span>
                    <select
                      value={payerForm.policyFormat}
                      onChange={(event) =>
                        setPayerForm((current) => ({
                          ...current,
                          policyFormat: event.target.value,
                        }))
                      }
                    >
                      <option value="PDF">PDF</option>
                      <option value="PDF (Scanned)">PDF (Scanned)</option>
                      <option value="PDF (Native)">PDF (Native)</option>
                    </select>
                  </label>

                  <button className="settings-primary-btn add-payer-submit" type="submit">
                    {editingPayerIndex === null ? "Submit" : "Update"}
                  </button>

                  {addPayerError && <p className="add-payer-error">{addPayerError}</p>}
                </form>
              )}

              <div className="payer-toolbar">
                <div className="payer-search-wrap">
                  <Search size={16} />
                  <input type="text" placeholder="Search payers..." />
                </div>

                <div className="payer-filters">
                  <label><input type="checkbox" /> Active</label>
                  <label><input type="checkbox" /> Inactive</label>
                  <label><input type="checkbox" /> Missing Upload</label>
                </div>
              </div>

              <div className="payer-table-wrap">
                <table className="payer-table">
                  <thead>
                    <tr>
                      <th>Name <ChevronsUpDown size={14} /></th>
                      <th>Abbreviation <ChevronsUpDown size={14} /></th>
                      <th>Policy Format <ChevronsUpDown size={14} /></th>
                      <th>Status <ChevronsUpDown size={14} /></th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payerRows.map((payer, index) => (
                      <tr key={payer.name}>
                        <td className="cell-name">{payer.name}</td>
                        <td>{payer.abbreviation}</td>
                        <td>{payer.policyFormat}</td>
                        <td>
                          <span className={`status-chip ${payer.status === "Uploaded" ? "uploaded" : "missing"}`}>
                            {payer.status}
                          </span>
                          <span className="quarter-tag">{payer.quarter}</span>
                        </td>
                        <td>
                          <div className="action-cell">
                            <button className="inline-btn" type="button" onClick={() => handlePayerEdit(payer, index)}>
                              <Pencil size={14} /> Edit
                            </button>
                            <button className="inline-btn" type="button" onClick={() => handleTogglePayerActive(index)}>
                              <ChevronDown size={14} /> {payer.active ? "Active" : "Inactive"}
                              <span className={`tiny-toggle ${payer.active ? "on" : "off"}`} aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="panel-footer">
                <span>Showing {payerRows.length} of {payerRows.length}</span>
                <button className="pager-btn" type="button" aria-label="Next page">
                  <ChevronRight size={14} />
                </button>
              </div>
            </section>

            <section className="settings-bottom-grid">
              <div className="settings-panel">
                <div className="settings-panel-header">
                  <h3>Admin Profile</h3>
                </div>

                <div className="profile-row">
                  <img src={`https://i.pravatar.cc/80?img=${avatarIndex}`} alt="Admin" className="profile-photo" />
                  <button className="photo-link-btn" type="button" onClick={handleUploadNewPhoto}>Upload New Photo</button>
                </div>

                <div className="profile-fields">
                  <label className="settings-field">
                    <span>Name</span>
                    <input type="text" value={profileName} onChange={(event) => setProfileName(event.target.value)} />
                  </label>

                  <label className="settings-field">
                    <span>Email</span>
                    <div className="with-action">
                      <div className="with-icon">
                        <Mail size={15} />
                        <input
                          type="email"
                          value={profileEmail}
                          readOnly={!isEditingEmail}
                          onChange={(event) => setProfileEmail(event.target.value)}
                        />
                      </div>
                      <button
                        className="inline-btn"
                        type="button"
                        onClick={() => setIsEditingEmail((editing) => !editing)}
                      >
                        <Lock size={14} /> {isEditingEmail ? "Done" : "Change"}
                      </button>
                    </div>
                  </label>
                </div>

                <div className="profile-actions">
                  <button className="settings-primary-btn" type="button" onClick={handleSaveProfile}>
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="settings-panel">
                <div className="settings-panel-header">
                  <h3>Quarter Management</h3>
                  <button
                    className="settings-primary-btn quarter-action-btn"
                    type="button"
                    onClick={() => {
                      setShowAddQuarterForm((show) => !show);
                      setAddQuarterError("");
                    }}
                  >
                    <Plus size={16} />
                    {showAddQuarterForm ? "Cancel" : "Create New Quarter"}
                  </button>
                </div>

                {showAddQuarterForm && (
                  <form className="add-quarter-form" onSubmit={handleAddQuarterSubmit}>
                    <label>
                      <span>Quarter</span>
                      <select
                        value={newQuarter.quarter}
                        onChange={(event) =>
                          setNewQuarter((current) => ({
                            ...current,
                            quarter: event.target.value,
                          }))
                        }
                      >
                        <option value="Q1">Q1</option>
                        <option value="Q2">Q2</option>
                        <option value="Q3">Q3</option>
                        <option value="Q4">Q4</option>
                      </select>
                    </label>

                    <label>
                      <span>Year</span>
                      <input
                        type="text"
                        placeholder="2026"
                        maxLength={4}
                        value={newQuarter.year}
                        onChange={(event) =>
                          setNewQuarter((current) => ({
                            ...current,
                            year: event.target.value.replace(/\D/g, "").slice(0, 4),
                          }))
                        }
                      />
                    </label>

                    <button className="settings-primary-btn add-quarter-submit" type="submit">
                      Submit
                    </button>

                    {addQuarterError && <p className="add-quarter-error">{addQuarterError}</p>}
                  </form>
                )}

                <div className="quarter-active">Current Active Quarter <strong>Q2 2026</strong></div>

                <div className="quarter-list">
                  {quarterRows.map((q) => (
                    <div key={q} className="quarter-row">
                      <span>{q}</span>
                      <button className="inline-btn" type="button" onClick={() => handleCloseQuarter(q)}>
                        <Lock size={14} /> Close
                      </button>
                    </div>
                  ))}
                </div>

                <div className="panel-footer quarter-footer">
                  <span>Showing {quarterRows.length} of {quarterRows.length}</span>
                  <div className="quarter-pager">
                    <button className="pager-btn" type="button" aria-label="Previous"><ChevronLeft size={14} /></button>
                    <span className="page-current">1</span>
                    <button className="pager-btn" type="button" aria-label="Next"><ChevronRight size={14} /></button>
                    <button className="pager-btn" type="button" aria-label="Last"><ChevronRight size={14} /></button>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
