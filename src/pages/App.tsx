import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import UploadDocument from "./UploadDocument";
import DrugSearch from "./DrugSearch";
import AdminSignIn from "./AdminSignIn";
import AdminSignUp from "./AdminSignUp";
import UserSignIn from "./UserSignIn";
import UserSignUp from "./UserSignUp";
import SettingsPage from "./SettingsPage";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/upload" element={<UploadDocument />} />
      <Route path="/drug-search" element={<DrugSearch />} />

      <Route path="/admin/signin" element={<AdminSignIn />} />
      <Route path="/admin/signup" element={<AdminSignUp />} />
      <Route path="/user/signin" element={<UserSignIn />} />
      <Route path="/user/signup" element={<UserSignUp />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
};

export default App;