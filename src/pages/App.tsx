import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import UploadDocument from "./UploadDocument";
import DrugSearch from "./DrugSearch";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/upload" element={<UploadDocument />} />
      <Route path="/drug-search" element={<DrugSearch />} />
    </Routes>
  );
};

export default App;