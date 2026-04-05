import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "/src/components/logo.svg";

import {
  Bell,
  ChevronDown,
  FileText,
  Pill,
  ShieldCheck,
  Settings,
  Home,
  Search,
  FilePlus2,
  FolderCog,
  ScanSearch,
  CheckCircle2,
  XCircle,
  CircleAlert,
} from "lucide-react";

const BRAND_NAME = "Drug Coverage Hub";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
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

      {/* Sidebar and main content */}
      <div className="content-wrapper">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <button className="nav-item active">
              <Home size={18} />
              <span>Dashboard</span>
            </button>
            <button className="nav-item" onClick={() => navigate('/upload')}>
              <FileText size={18} />
              <span>Documents</span>
            </button>
            <button className="nav-item" onClick={() => navigate('/drug-search')}>
              <Pill size={18} />
              <span>Drug Search</span>
            </button>
            <button className="nav-item" onClick={() => navigate('/settings')}>
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </nav>
        </aside>

        <div className="main-shell">
          <main className="main-content">
          <div className="page-header">
            <h1>Admin Dashboard</h1>
            <p>Overview of drug coverage documents and analytics</p>
          </div>

          <section className="dashboard-content">
            <div className="title-row">

              <div className="search-bar">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search documents, payers, reviews..."
                />
              </div>
            </div>

          <div className="stats-grid">
            <div className="stat-card blue">
              <div>
                <p>Total Documents</p>
                <h2>28</h2>
              </div>
              <FileText size={34} />
            </div>

            <div className="stat-card green">
              <div>
                <p>Drugs Extracted</p>
                <h2>5</h2>
              </div>
              <Pill size={34} />
            </div>

            <div className="stat-card orange">
              <div>
                <p>Conditions Extracted</p>
                <h2>23</h2>
              </div>
              <ScanSearch size={34} />
            </div>

            <div className="stat-card purple">
              <div>
                <p>Pending Reviews</p>
                <h2>3</h2>
              </div>
              <FolderCog size={34} />
            </div>
          </div>

          <div className="middle-grid">
            <div className="card latest-uploads">
              <div className="card-header">
                <h3>Latest Uploads</h3>
              </div>

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
                    <td>UHC Policy Q2 2026</td>
                    <td>UnitedHealthcare</td>
                    <td>April 5, 2026</td>
                    <td>
                      <span className="status completed">Completed</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Aetna Policy Q1 2026</td>
                    <td>Aetna</td>
                    <td>March 28, 2026</td>
                    <td>
                      <span className="status processing">Processing...</span>
                    </td>
                  </tr>
                  <tr>
                    <td>BCBS Policy 2026</td>
                    <td>Blue Cross Blue Shield</td>
                    <td>March 15, 2026</td>
                    <td>
                      <span className="status failed">Failed</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card success-card">
              <div className="card-header">
                <h3>Extraction Success Rate</h3>
              </div>

              <div className="progress-wrap">
                <div className="progress-ring">
                  <div className="progress-inner">
                    <h2>92%</h2>
                    <p>Success Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bottom-grid">
            <div className="card quick-actions">
              <div className="card-header">
                <h3>Quick Actions</h3>
              </div>

              <div className="action-grid">
                <button className="action-card" onClick={() => navigate('/upload')}>
                  <FilePlus2 size={34} />
                  <span>Upload Document</span>
                </button>

                <button className="action-card">
                  <FolderCog size={34} />
                  <span>Manage Drugs</span>
                </button>

                <button className="action-card">
                  <Search size={34} />
                  <span>Review Extracted Data</span>
                </button>

                <button className="action-card">
                  <ShieldCheck size={34} />
                  <span>View Audit Logs</span>
                </button>
              </div>
            </div>

            <div className="card recent-activity">
              <div className="card-header">
                <h3>Recent Activity</h3>
              </div>

              <div className="activity-list">
                <div className="activity-item">
                  <CheckCircle2 className="activity-icon success" size={18} />
                  <span>
                    Admin approved <strong>"UHC Policy Q2 2026"</strong> - 2
                    hours ago
                  </span>
                </div>

                <div className="activity-item">
                  <CheckCircle2 className="activity-icon greenish" size={18} />
                  <span>
                    System extracted new drug: <strong>Daxxify</strong> - 1 day
                    ago
                  </span>
                </div>

                <div className="activity-item">
                  <CircleAlert className="activity-icon warning" size={18} />
                  <span>
                    Review needed for <strong>"BCBS Policy 2026"</strong> - 3
                    days ago
                  </span>
                </div>

                <div className="activity-item">
                  <XCircle className="activity-icon danger" size={18} />
                  <span>
                    Document upload failed -{" "}
                    <strong>Aetna Policy Q1 2026</strong> - 5 days ago
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

export default AdminDashboard;