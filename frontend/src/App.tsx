import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import DrugSearch from "./pages/DrugSearch";
import IndicationSearch from "./pages/IndicationSearch";
import ICD10Search from "./pages/ICD10Search";
import PARequirements from "./pages/PARequirements";
import Compare from "./pages/Compare";
import Layout from "./components/Layout";
import "./styles/global.css";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/drug" element={<DrugSearch />} />
          <Route path="/indication" element={<IndicationSearch />} />
          <Route path="/icd10" element={<ICD10Search />} />
          <Route path="/pa" element={<PARequirements />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
