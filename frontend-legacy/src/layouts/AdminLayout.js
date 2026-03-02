import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Radio, Settings2, Percent, GitBranch,
  Activity, FileText, BookOpen, FlaskConical, Clock, AlertTriangle,
  FileCheck, Globe, RefreshCw, Shield, LogOut
} from 'lucide-react';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/operators', label: 'Operators', icon: Radio },
  { path: '/admin/api-config', label: 'API Config', icon: Settings2 },
  { path: '/admin/commission', label: 'Commission', icon: Percent },
  { path: '/admin/routing', label: 'Routing', icon: GitBranch },
  { type: 'divider', label: 'Transactions' },
  { path: '/admin/live-transactions', label: 'Live Transactions', icon: Activity },
  { path: '/admin/pending-report', label: 'Pending Report', icon: Clock },
  { path: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
  { type: 'divider', label: 'Reports & Tools' },
  { path: '/admin/reports', label: 'Reports', icon: FileText },
  { path: '/admin/ledger', label: 'Ledger', icon: BookOpen },
  { path: '/admin/reconciliation', label: 'Reconciliation', icon: RefreshCw },
  { type: 'divider', label: 'Management' },
  { path: '/admin/kyc', label: 'KYC Verify', icon: FileCheck },
  { path: '/admin/reseller-api', label: 'Reseller API', icon: Globe },
  { path: '/admin/2fa', label: '2FA Settings', icon: Shield },
  { path: '/admin/sandbox', label: 'Sandbox Test', icon: FlaskConical },
];

const AdminLayout = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="flex h-screen bg-background" data-testid="admin-layout">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 text-white flex flex-col shrink-0" data-testid="admin-sidebar">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold tracking-tight">PaisaPe</h1>
          <p className="text-xs text-slate-400">Admin Panel</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item, idx) => {
            if (item.type === 'divider') {
              return <p key={idx} className="px-4 pt-4 pb-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{item.label}</p>;
            }
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${active ? 'bg-slate-700/70 text-white font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <button onClick={logout} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white w-full" data-testid="admin-logout-btn">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6" data-testid="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
