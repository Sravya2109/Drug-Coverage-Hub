import React, { useEffect, useRef, useState } from "react";
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
const RECENT_UPLOADS_STORAGE_KEY = "drugCoverageHub.recentUploads";
const RECENT_ACTIVITIES_STORAGE_KEY = "drugCoverageHub.recentActivities";

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

const defaultRecentUploads: UploadRecord[] = [
  {
    id: 1,
    name: "BCBS Policy 2026",
    payer: "Blue Cross Blue Shield",
    uploadDate: "March 15, 2026",
    status: "Failed",
  },
  {
    id: 2,
    name: "UHC Policy Q2 2026",
    payer: "UnitedHealthcare",
    uploadDate: "April 5, 2026",
    status: "Completed",
  },
  {
    id: 3,
    name: "Aetna Policy Q1 2026",
    payer: "Aetna",
    uploadDate: "March 28, 2026",
    status: "Processing...",
  },
];

const defaultRecentActivities: ActivityRecord[] = [
  {
    id: 1,
    text: 'Uploading "Aetna Policy Q2 2026" - Just now',
    type: "amber",
  },
  {
    id: 2,
    text: 'Admin approved "UHC Policy Q2 2026" - 2 hours ago',
    type: "blue",
  },
  {
    id: 3,
    text: "System extracted new drug: Daxxify - 1 day ago",
    type: "green",
  },
  {
    id: 4,
    text: 'Review needed for "BCBS Policy 2026" - 3 days ago',
    type: "orange",
  },
  {
    id: 5,
    text: "Document upload failed - Aetna Policy Q1 2026 - 5 days ago",
    type: "red",
  },
];

const parseStoredList = <T,>(storageKey: string, fallbackValue: T): T => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return fallbackValue;
    }
    const parsed = JSON.parse(raw) as T;
    return parsed;
  } catch {
    return fallbackValue;
  }
};

const UploadDocumentPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTimerRef = useRef<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("No file selected");
  const [selectedPayer, setSelectedPayer] = useState("UnitedHealthcare");
  const [uploadFeedback, setUploadFeedback] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeUploadId, setActiveUploadId] = useState<number | null>(null);
  const [activeUploadFileName, setActiveUploadFileName] = useState("No active upload");
  const [recentUploads, setRecentUploads] = useState<UploadRecord[]>(() =>
    parseStoredList<UploadRecord[]>(RECENT_UPLOADS_STORAGE_KEY, defaultRecentUploads)
  );
  const [recentActivities, setRecentActivities] = useState<ActivityRecord[]>(() =>
    parseStoredList<ActivityRecord[]>(RECENT_ACTIVITIES_STORAGE_KEY, defaultRecentActivities)
  );

  useEffect(() => {
    return () => {
      if (uploadTimerRef.current !== null) {
        window.clearInterval(uploadTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(RECENT_UPLOADS_STORAGE_KEY, JSON.stringify(recentUploads));
  }, [recentUploads]);

  useEffect(() => {
    localStorage.setItem(RECENT_ACTIVITIES_STORAGE_KEY, JSON.stringify(recentActivities));
  }, [recentActivities]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const getFormattedDate = () => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date());
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file ?? null);
    setSelectedFileName(file ? file.name : "No file selected");
    setUploadFeedback("");
  };

  const handleUploadDocument = () => {
    if (!selectedFile) {
      setUploadFeedback("Please select a PDF file first.");
      openFilePicker();
      return;
    }

    const newUploadId = Date.now();
    const uploadDate = getFormattedDate();

    const newUpload: UploadRecord = {
      id: newUploadId,
      name: selectedFile.name,
      payer: selectedPayer,
      uploadDate,
      status: "Processing...",
    };

    setRecentUploads((current) => [newUpload, ...current]);
    setRecentActivities((current) => [
      {
        id: Date.now() + 1,
        text: `Uploading \"${selectedFile.name}\" - Just now`,
        type: "amber",
      },
      ...current,
    ]);
    setUploadFeedback("Upload started.");
    setUploadProgress(0);
    setActiveUploadId(newUploadId);
    setActiveUploadFileName(selectedFile.name);

    if (uploadTimerRef.current !== null) {
      window.clearInterval(uploadTimerRef.current);
    }

    uploadTimerRef.current = window.setInterval(() => {
      setUploadProgress((currentProgress) => {
        const nextProgress = Math.min(currentProgress + 20, 100);

        if (nextProgress === 100) {
          if (uploadTimerRef.current !== null) {
            window.clearInterval(uploadTimerRef.current);
            uploadTimerRef.current = null;
          }

          setRecentUploads((currentUploads) =>
            currentUploads.map((item) =>
              item.id === newUploadId ? { ...item, status: "Completed" } : item
            )
          );

          setRecentActivities((current) => [
            {
              id: Date.now() + 2,
              text: `Document uploaded successfully - ${selectedFile.name} - Just now`,
              type: "green",
            },
            ...current,
          ]);
          setUploadFeedback("Upload complete.");
          setSelectedFile(null);
          setSelectedFileName("No file selected");
          setActiveUploadId(null);
        }

        return nextProgress;
      });
    }, 350);
  };

  const handleCancelUpload = () => {
    if (activeUploadId === null) {
      return;
    }

    if (uploadTimerRef.current !== null) {
      window.clearInterval(uploadTimerRef.current);
      uploadTimerRef.current = null;
    }

    setRecentUploads((currentUploads) =>
      currentUploads.map((item) =>
        item.id === activeUploadId ? { ...item, status: "Failed" } : item
      )
    );
    setRecentActivities((current) => [
      {
        id: Date.now() + 3,
        text: `Upload cancelled - ${activeUploadFileName} - Just now`,
        type: "red",
      },
      ...current,
    ]);
    setUploadFeedback("Upload cancelled.");
    setUploadProgress(0);
    setActiveUploadId(null);
    setActiveUploadFileName("No active upload");
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
                      <select
                        className="input select-dropdown"
                        value={selectedPayer}
                        onChange={(event) => setSelectedPayer(event.target.value)}
                      >
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
                    <button className="primary-btn" type="button" onClick={handleUploadDocument}>
                      Upload Document
                    </button>
                  </div>
                  {uploadFeedback && <p className="upload-feedback">{uploadFeedback}</p>}
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
                        {recentUploads.map((row) => (
                          <tr key={row.id}>
                            <td className="strong-cell">{row.name}</td>
                            <td>{row.payer}</td>
                            <td>{row.uploadDate}</td>
                            <td>
                              <span
                                className={`status-badge ${
                                  row.status === "Completed"
                                    ? "completed"
                                    : row.status === "Processing..."
                                      ? "processing"
                                      : "failed"
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
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
                      Uploading: <strong>{activeUploadFileName}</strong>
                    </div>

                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                    </div>

                    <div className="progress-footer">
                      <span>Progress: {uploadProgress}%</span>
                      <button className="outline-btn" type="button" onClick={handleCancelUpload}>
                        Cancel Upload
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card side-card">
                  <h3>Recent Activity</h3>

                  <div className="activity-list">
                    {recentActivities.map((activity) => (
                      <div className="activity-item" key={activity.id}>
                        {activity.type === "amber" && (
                          <Circle
                            size={14}
                            className="activity-icon amber"
                            fill="currentColor"
                          />
                        )}
                        {activity.type === "blue" && (
                          <CheckCircle2 size={16} className="activity-icon blue" />
                        )}
                        {activity.type === "green" && (
                          <CheckCircle2 size={16} className="activity-icon green" />
                        )}
                        {activity.type === "orange" && (
                          <Clock3 size={16} className="activity-icon orange" />
                        )}
                        {activity.type === "red" && (
                          <XCircle size={16} className="activity-icon red" />
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

export default UploadDocumentPage;
