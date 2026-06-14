import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Tasks from "@/pages/Tasks";
import Matching from "@/pages/Matching";
import Issues from "@/pages/Issues";
import Rectification from "@/pages/Rectification";
import Analytics from "@/pages/Analytics";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/tasks" replace />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/matching" element={<Matching />} />
          <Route path="/issues" element={<Issues />} />
          <Route path="/rectification" element={<Rectification />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </Router>
  );
}
