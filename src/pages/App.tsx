import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import UploadDocument from "./UploadDocument";
import DrugSearch from "./DrugSearch";
import SettingsPage from "./SettingsPage";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/upload" element={<UploadDocument />} />
      <Route path="/drug-search" element={<DrugSearch />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
};

export default App;