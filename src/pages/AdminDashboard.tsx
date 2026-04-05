import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "/src/components/logo.svg";

import {
  Bell,
  ChevronDown,
  FileText,
  Pill,
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
const DASHBOARD_UPLOADS_STORAGE_KEY = "drugCoverageHub.recentUploads";
const DASHBOARD_ACTIVITIES_STORAGE_KEY = "drugCoverageHub.recentActivities";

interface UploadRecord {
  id: number;
  name: string;
  payer: string;
  uploadDate: string;
  status: "Completed" | "Processing..." | "Failed";
}

interface ActivityRecord {
  id: number;
  text: string;
  type: "amber" | "blue" | "green" | "orange" | "red";
}

const fallbackUploads: UploadRecord[] = [
  {
    id: 1,
    name: "UHC Policy Q2 2026",
    payer: "UnitedHealthcare",
    uploadDate: "April 5, 2026",
    status: "Completed",
  },
  {
    id: 2,
    name: "Aetna Policy Q1 2026",
    payer: "Aetna",
    uploadDate: "March 28, 2026",
    status: "Processing...",
  },
  {
    id: 3,
    name: "BCBS Policy 2026",
    payer: "Blue Cross Blue Shield",
    uploadDate: "March 15, 2026",
    status: "Failed",
  },
];

const fallbackActivities: ActivityRecord[] = [
  {
    id: 1,
    text: 'Admin approved "UHC Policy Q2 2026" - 2 hours ago',
    type: "blue",
  },
  {
    id: 2,
    text: "System extracted new drug: Daxxify - 1 day ago",
    type: "green",
  },
  {
    id: 3,
    text: 'Review needed for "BCBS Policy 2026" - 3 days ago',
    type: "orange",
  },
  {
    id: 4,
    text: "Document upload failed - Aetna Policy Q1 2026 - 5 days ago",
    type: "red",
  },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [latestUploads, setLatestUploads] = useState<UploadRecord[]>(fallbackUploads);
  const [recentActivity, setRecentActivity] = useState<ActivityRecord[]>(fallbackActivities);

  useEffect(() => {
    const loadDashboardData = () => {
      try {
        const savedUploads = localStorage.getItem(DASHBOARD_UPLOADS_STORAGE_KEY);
        const savedActivities = localStorage.getItem(DASHBOARD_ACTIVITIES_STORAGE_KEY);

        if (savedUploads) {
          const parsedUploads = JSON.parse(savedUploads) as UploadRecord[];
          if (Array.isArray(parsedUploads) && parsedUploads.length > 0) {
            setLatestUploads(parsedUploads);
          }
        }

        if (savedActivities) {
          const parsedActivities = JSON.parse(savedActivities) as ActivityRecord[];
          if (Array.isArray(parsedActivities) && parsedActivities.length > 0) {
            setRecentActivity(parsedActivities);
          }
        }
      } catch {
        setLatestUploads(fallbackUploads);
        setRecentActivity(fallbackActivities);
      }
    };

    loadDashboardData();
    window.addEventListener("storage", loadDashboardData);
    window.addEventListener("focus", loadDashboardData);

    return () => {
      window.removeEventListener("storage", loadDashboardData);
      window.removeEventListener("focus", loadDashboardData);
    };
  }, []);

  const latestUploadsToShow = useMemo(() => latestUploads.slice(0, 5), [latestUploads]);
  const recentActivityToShow = useMemo(() => recentActivity.slice(0, 5), [recentActivity]);

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
                  {latestUploadsToShow.map((upload) => (
                    <tr key={upload.id}>
                      <td>{upload.name}</td>
                      <td>{upload.payer}</td>
                      <td>{upload.uploadDate}</td>
                      <td>
                        <span
                          className={`status ${
                            upload.status === "Completed"
                              ? "completed"
                              : upload.status === "Processing..."
                                ? "processing"
                                : "failed"
                          }`}
                        >
                          {upload.status}
                        </span>
                      </td>
                    </tr>
                  ))}
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

                <button className="action-card" onClick={() => navigate('/drug-search')}>
                  <FolderCog size={34} />
                  <span>Manage Drugs</span>
                </button>
              </div>
            </div>

            <div className="card recent-activity">
              <div className="card-header">
                <h3>Recent Activity</h3>
              </div>

              <div className="activity-list">
                {recentActivityToShow.map((activity) => (
                  <div className="activity-item" key={activity.id}>
                    {activity.type === "amber" && (
                      <CircleAlert className="activity-icon warning" size={18} />
                    )}
                    {activity.type === "blue" && (
                      <CheckCircle2 className="activity-icon success" size={18} />
                    )}
                    {activity.type === "green" && (
                      <CheckCircle2 className="activity-icon greenish" size={18} />
                    )}
                    {activity.type === "orange" && (
                      <CircleAlert className="activity-icon warning" size={18} />
                    )}
                    {activity.type === "red" && (
                      <XCircle className="activity-icon danger" size={18} />
                    )}
                    <span>{activity.text}</span>
                  </div>
                ))}
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