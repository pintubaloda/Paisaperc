import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import RechargePage from './pages/RechargePage';
import WalletPage from './pages/WalletPage';
import UserReports from './pages/UserReports';
import UserSettings from './pages/UserSettings';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import OperatorsManagement from './pages/admin/OperatorsManagement';
import APIConfigurationEnhanced from './pages/admin/APIConfigurationEnhanced';
import CommissionManagement from './pages/admin/CommissionManagement';
import RoutingRules from './pages/admin/RoutingRules';
import LiveTransactions from './pages/admin/LiveTransactions';
import SandboxTest from './pages/admin/SandboxTest';
import LedgerReport from './pages/admin/LedgerReport';
import AdvancedReports from './pages/admin/AdvancedReports';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="recharge" element={<RechargePage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="reports" element={<UserReports />} />
            <Route path="settings" element={<UserSettings />} />
          </Route>
          
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="operators" element={<OperatorsManagement />} />
            <Route path="api-config" element={<APIConfigurationEnhanced />} />
            <Route path="commission" element={<CommissionManagement />} />
            <Route path="routing" element={<RoutingRules />} />
            <Route path="transactions" element={<LiveTransactions />} />
            <Route path="sandbox" element={<SandboxTest />} />
            <Route path="ledger" element={<LedgerReport />} />
            <Route path="reports" element={<AdvancedReports />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
