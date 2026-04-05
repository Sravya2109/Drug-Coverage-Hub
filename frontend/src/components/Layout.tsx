import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Bell, ChevronDown, Pill, Home, FileText,
  Search, GitCompare, ClipboardList, Stethoscope, Activity, Menu,
} from "lucide-react";

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  section?: string;
}

const NAV: NavItem[] = [
  { path: "/",           icon: <Home size={16} />,          label: "Dashboard",        section: "Main" },
  { path: "/upload",     icon: <FileText size={16} />,       label: "Upload Policy",    section: "Main" },
  { path: "/drug",       icon: <Search size={16} />,         label: "Drug Search",      section: "Search" },
  { path: "/indication", icon: <Stethoscope size={16} />,    label: "By Indication",    section: "Search" },
  { path: "/icd10",      icon: <Activity size={16} />,       label: "By ICD-10",        section: "Search" },
  { path: "/pa",         icon: <ClipboardList size={16} />,  label: "PA Requirements",  section: "Search" },
  { path: "/compare",    icon: <GitCompare size={16} />,     label: "Payer Comparison", section: "Compare" },
];

interface Props { children: React.ReactNode }

export default function Layout({ children }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const sections = [...new Set(NAV.map(n => n.section))];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <button
            className="collapse-btn"
            aria-label="Toggle sidebar"
            onClick={() => setCollapsed((c) => !c)}
          >
            <Menu size={16} />
          </button>
          <Pill size={22} className="brand-icon" />
          <span className="brand-text">Drug Coverage Hub</span>
        </div>
        <div className="topbar-right">
          <span className="welcome-text">Welcome, Admin</span>
          <button className="icon-btn" aria-label="Notifications"><Bell size={16} /></button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <div className="avatar">A</div>
            <ChevronDown size={14} style={{ color: "rgba(255,255,255,.6)" }} />
          </div>
        </div>
      </header>

      <div className={`body-wrap${collapsed ? " sidebar-collapsed" : ""}`}>
        <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
          {sections.map(sec => (
            <div key={sec} className="sidebar-section">
              <p className="sidebar-label">{sec}</p>
              {NAV.filter(n => n.section === sec).map(item => (
                <button
                  key={item.path}
                  className={`nav-item${pathname === item.path ? " active" : ""}`}
                  onClick={() => navigate(item.path)}
                >
                  {item.icon}
                  <span className="nav-text">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </aside>

        <main className={`main-wrap${collapsed ? " collapsed" : ""}`}>
          <div className="main-container">
            {children}
          </div>
          <footer className="app-footer">
            <div>Drug Coverage Hub · Coverage intelligence for medical policies</div>
            <span className="footer-pill">API v1</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
