import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Home,
  FileText,
  Pill,
  Settings,
  Upload,
  CheckCircle2,
  Clock3,
  XCircle,
  Circle,
} from "lucide-react";
import logo from "/src/components/logo.svg";
import "../styles/UploadDocument.css";

const BRAND_NAME = "Drug Coverage Hub";

const UploadDocumentPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("No file selected");

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFileName(file ? file.name : "No file selected");
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
              <img src="https://i.pravatar.cc/48?img=32" alt="Admin" />
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

            <button className="nav-item active">
              <FileText size={18} />
              <span>Documents</span>
            </button>

            <button className="nav-item" onClick={() => navigate("/drug-search")}> 
              <Pill size={18} />
              <span>Drug Search</span>
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
              <h1>Upload New Document</h1>
              <p>
                Upload a new insurance policy document for processing. Fill out the
                details below and select a PDF to upload.
              </p>
            </section>

            <section className="content-grid">
              <div className="left-column">
                <div className="card form-card">
                  <div className="form-grid three-columns">
                    <div className="field">
                      <label>Payer</label>
                      <select className="input select-dropdown">
                        <option>UnitedHealthcare</option>
                        <option>Aetna</option>
                        <option>Blue Cross Blue Shield</option>
                        <option>Cigna</option>
                        <option>Humana</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>Policy Type</label>
                      <select className="input select-dropdown">
                        <option>Drug Policy</option>
                        <option>Medical Policy</option>
                        <option>Dental Policy</option>
                        <option>Vision Policy</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>
                        Quarter <span className="required">*</span>
                      </label>
                      <select className="input select-dropdown">
                        <option>Q1</option>
                        <option>Q2</option>
                        <option>Q3</option>
                        <option>Q4</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid two-columns">
                    <div className="field">
                      <label>
                        Date <span className="required">*</span>
                      </label>
                      <div className="split-input">
                        <select className="input select-dropdown">
                          <option>January</option>
                          <option>February</option>
                          <option>March</option>
                          <option>April</option>
                          <option>May</option>
                          <option>June</option>
                          <option>July</option>
                          <option>August</option>
                          <option>September</option>
                          <option>October</option>
                          <option>November</option>
                          <option>December</option>
                        </select>
                        <select className="input year-box select-dropdown">
                          <option>2024</option>
                          <option>2025</option>
                          <option>2026</option>
                          <option>2027</option>
                        </select>
                      </div>
                    </div>

                    <div className="field">
                      <label>
                        Year <span className="required">*</span>
                      </label>
                      <select className="input select-dropdown">
                        <option>2024</option>
                        <option>2025</option>
                        <option>2026</option>
                        <option>2027</option>
                      </select>
                    </div>
                  </div>

                  <div className="upload-dropzone" onClick={openFilePicker} role="button" tabIndex={0} onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openFilePicker();
                    }
                  }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden-file-input"
                      onChange={handleFileChange}
                    />
                    <div className="upload-icon">
                      <Upload size={34} />
                    </div>
                    <h3>
                      Drag &amp; drop PDF file here, <span>or click to browse</span>
                    </h3>
                    <p>* Maximum file size: 25MB</p>
                    <p className="selected-file-name">{selectedFileName}</p>
                  </div>

                  <div className="form-footer">
                    <span className="recent-upload-text">Recent Uploads</span>
                    <button className="primary-btn" type="button" onClick={openFilePicker}>
                      Upload Document
                    </button>
                  </div>
                </div>

                <div className="recent-table-wrap">
                  <h2>Recent Uploads</h2>

                  <div className="card table-card">
                    <table>
                      <thead>
                        <tr>
                          <th>Document Name</th>
                          <th>Payer</th>
                          <th>Upload Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="strong-cell">BCBS Policy 2026</td>
                          <td>Blue Cross Blue Shield</td>
                          <td>March 15, 2026</td>
                          <td>
                            <span className="status-badge failed">Failed</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="strong-cell">UHC Policy Q2 2026</td>
                          <td>UnitedHealthcare</td>
                          <td>April 5, 2026</td>
                          <td>
                            <span className="status-badge completed">Completed</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="strong-cell">Aetna Policy Q1 2026</td>
                          <td>Aetna</td>
                          <td>March 28, 2026</td>
                          <td>
                            <span className="status-badge processing">Processing...</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="right-column">
                <div className="card side-card">
                  <h3>Upload Progress</h3>

                  <div className="progress-box">
                    <div className="uploading-file">
                      Uploading: <strong>Aetna_Policy_Q2_2026.pdf</strong>
                    </div>

                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: "40%" }} />
                    </div>

                    <div className="progress-footer">
                      <span>Progress: 40%</span>
                      <button className="outline-btn" type="button">Cancel Upload</button>
                    </div>
                  </div>
                </div>

                <div className="card side-card">
                  <h3>Recent Activity</h3>

                  <div className="activity-list">
                    <div className="activity-item">
                      <Circle size={14} className="activity-icon amber" fill="currentColor" />
                      <span>
                        Uploading <strong>&quot;Aetna Policy Q2 2026&quot;</strong> - Just now
                      </span>
                    </div>

                    <div className="activity-item">
                      <CheckCircle2 size={16} className="activity-icon blue" />
                      <span>
                        Admin approved <strong>&quot;UHC Policy Q2 2026&quot;</strong> - 2 hours ago
                      </span>
                    </div>

                    <div className="activity-item">
                      <CheckCircle2 size={16} className="activity-icon green" />
                      <span>
                        System extracted new drug: <strong>Daxxify</strong> - 1 day ago
                      </span>
                    </div>

                    <div className="activity-item">
                      <Clock3 size={16} className="activity-icon orange" />
                      <span>
                        Review needed for <strong>&quot;BCBS Policy 2026&quot;</strong> - 3 days ago
                      </span>
                    </div>

                    <div className="activity-item">
                      <XCircle size={16} className="activity-icon red" />
                      <span>
                        Document upload failed - <strong>Aetna Policy Q1 2026</strong> - 5 days ago
                      </span>
                    </div>
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

export default UploadDocumentPage;
