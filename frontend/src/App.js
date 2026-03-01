import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/LoginPage';
import Register from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import OperatorsManagement from './pages/admin/OperatorsManagement';
import APIConfigurationEnhanced from './pages/admin/APIConfigurationEnhanced';
import CommissionManagement from './pages/admin/CommissionManagement';
import RoutingRules from './pages/admin/RoutingRules';
import LiveTransactions from './pages/admin/LiveTransactions';
import AdvancedReports from './pages/admin/AdvancedReports';
import LedgerReport from './pages/admin/LedgerReport';
import SandboxTest from './pages/admin/SandboxTest';
import PendingReport from './pages/admin/PendingReport';
import DisputeReport from './pages/admin/DisputeReport';
import KYCManagement from './pages/admin/KYCManagement';
import ResellerAPI from './pages/admin/ResellerAPI';
import ReconciliationPage from './pages/admin/ReconciliationPage';
import TwoFactorSettings from './pages/settings/TwoFactorSettings';
import KYCSubmit from './pages/settings/KYCSubmit';
import RechargePage from './pages/RechargePage';
import WalletPage from './pages/WalletPage';
import UserReports from './pages/UserReports';
import UserSettings from './pages/UserSettings';
import AdminLayout from './layouts/AdminLayout';
import DashboardLayout from './layouts/DashboardLayout';

function AppRoutes() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isLoggedIn = !!user;

  return (
    <Routes>
      <Route path="/login" element={!isLoggedIn ? <Login /> : <Navigate to={isAdmin ? '/admin' : '/dashboard'} />} />
      <Route path="/register" element={!isLoggedIn ? <Register /> : <Navigate to="/dashboard" />} />

      {/* Admin Routes */}
      <Route path="/admin" element={isAdmin ? <AdminLayout /> : <Navigate to="/login" />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="operators" element={<OperatorsManagement />} />
        <Route path="api-config" element={<APIConfigurationEnhanced />} />
        <Route path="commission" element={<CommissionManagement />} />
        <Route path="routing" element={<RoutingRules />} />
        <Route path="live-transactions" element={<LiveTransactions />} />
        <Route path="pending-report" element={<PendingReport />} />
        <Route path="disputes" element={<DisputeReport />} />
        <Route path="reports" element={<AdvancedReports />} />
        <Route path="ledger" element={<LedgerReport />} />
        <Route path="kyc" element={<KYCManagement />} />
        <Route path="reseller-api" element={<ResellerAPI />} />
        <Route path="reconciliation" element={<ReconciliationPage />} />
        <Route path="sandbox" element={<SandboxTest />} />
        <Route path="2fa" element={<TwoFactorSettings />} />
      </Route>

      {/* User Routes */}
      <Route path="/dashboard" element={isLoggedIn ? <DashboardLayout /> : <Navigate to="/login" />}>
        <Route index element={<Dashboard />} />
        <Route path="recharge" element={<RechargePage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="reports" element={<UserReports />} />
        <Route path="settings" element={<UserSettings />} />
        <Route path="kyc" element={<KYCSubmit />} />
        <Route path="2fa" element={<TwoFactorSettings />} />
      </Route>

      <Route path="/" element={<Navigate to={isLoggedIn ? (isAdmin ? '/admin' : '/dashboard') : '/login'} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
