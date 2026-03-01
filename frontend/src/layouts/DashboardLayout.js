import React from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Smartphone, Home, Wallet, CreditCard, FileText, Settings, LogOut, Menu, Shield, FileCheck, BarChart3 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';

const DashboardLayout = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const navItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <CreditCard className="w-5 h-5" />, label: 'Recharge', path: '/dashboard/recharge' },
    { icon: <Wallet className="w-5 h-5" />, label: 'Wallet', path: '/dashboard/wallet' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Reports', path: '/dashboard/reports' },
    { icon: <FileCheck className="w-5 h-5" />, label: 'KYC', path: '/dashboard/kyc' },
    { icon: <Shield className="w-5 h-5" />, label: '2FA Security', path: '/dashboard/2fa' },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: '/dashboard/settings' },
  ];

  const Sidebar = () => (
    <div className="h-full flex flex-col bg-primary text-white p-6">
      <div className="flex items-center space-x-2 mb-8">
        <img src="/images/paisape-logo.png" alt="PaisaPe" className="h-10" />
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === item.path
                ? 'bg-accent text-white'
                : 'hover:bg-primary-hover text-white/80 hover:text-white'
            }`}
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      <Button
        variant="ghost"
        onClick={logout}
        className="w-full justify-start text-white/80 hover:text-white hover:bg-primary-hover"
        data-testid="logout-btn"
      >
        <LogOut className="w-5 h-5 mr-3" />
        Logout
      </Button>
    </div>
  );

  return (
    <div className="flex h-screen bg-secondary/20">
      <aside className="hidden lg:block w-64 border-r bg-primary">
        <Sidebar />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Sheet>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon" data-testid="mobile-menu-btn">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <Sidebar />
                </SheetContent>
              </Sheet>
              <h1 className="text-xl font-heading font-semibold text-primary">Welcome, {user.name}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
