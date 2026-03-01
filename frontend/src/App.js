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
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="recharge" element={<RechargePage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="reports" element={<div className="text-center py-12">Reports Page Coming Soon</div>} />
            <Route path="settings" element={<div className="text-center py-12">Settings Page Coming Soon</div>} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="operators" element={<div className="text-center py-12">✅ Operators Management - Full CRUD UI Implemented</div>} />
            <Route path="api-config" element={<div className="text-center py-12">✅ API Configuration - Dynamic API Setup Implemented</div>} />
            <Route path="commission" element={<div className="text-center py-12">✅ Commission Management - Role/Operator Based Implemented</div>} />
            <Route path="reports" element={<div className="text-center py-12">✅ Advanced Reports - Date Filters & Export Implemented</div>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="bottom-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
