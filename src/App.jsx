import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Reserves from "@/components/pages/Reserves";
import React from "react";
import Policies from "@/components/pages/Policies";
import Analytics from "@/components/pages/Analytics";
import Clients from "@/components/pages/Clients";
import AgentPerformance from "@/components/pages/AgentPerformance";
import Claims from "@/components/pages/Claims";
import ApprovalWorkflows from "@/components/pages/ApprovalWorkflows";
import Dashboard from "@/components/pages/Dashboard";
import Layout from "@/components/organisms/Layout";
function App() {
  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
<Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="policies" element={<Policies />} />
          <Route path="claims" element={<Claims />} />
          <Route path="approval-workflows" element={<ApprovalWorkflows />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="agent-performance" element={<AgentPerformance />} />
          <Route path="reserves" element={<Reserves />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;