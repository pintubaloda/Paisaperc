import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Smartphone, LayoutDashboard, Users, Settings, TrendingUp, Zap, DollarSign, LogOut, Menu, Route, Activity } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';

const AdminLayout = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: <Users className="w-5 h-5" />, label: 'Users', path: '/admin/users' },
    { icon: <Zap className="w-5 h-5" />, label: 'Operators', path: '/admin/operators' },
    { icon: <Settings className="w-5 h-5" />, label: 'API Config', path: '/admin/api-config' },
    { icon: <DollarSign className="w-5 h-5" />, label: 'Commission', path: '/admin/commission' },
    { icon: <Route className="w-5 h-5" />, label: 'Routing', path: '/admin/routing' },
    { icon: <Activity className="w-5 h-5" />, label: 'Transactions', path: '/admin/transactions' },
    { icon: <TrendingUp className="w-5 h-5" />, label: 'Reports', path: '/admin/reports' },
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
            data-testid={`admin-nav-${item.label.toLowerCase()}`}
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
        data-testid="admin-logout-btn"
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
                  <Button variant="ghost" size="icon" data-testid="admin-mobile-menu-btn">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <Sidebar />
                </SheetContent>
              </Sheet>
              <h1 className="text-xl font-heading font-semibold text-primary">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Logged in as</p>
                <p className="font-medium">{user.name}</p>
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

export default AdminLayout;
