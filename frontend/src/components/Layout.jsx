import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Package, Layers, ShoppingCart, Factory, FileBarChart2,
  Users, ChevronRight, Menu, X, LogOut, ChevronDown, ChevronUp, Bell, User
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }]
  },
  {
    label: 'Master Data',
    items: [
      { to: '/master/raw-materials', icon: Package, label: 'Raw Materials' },
      { to: '/master/products', icon: Layers, label: 'Product Models' },
    ]
  },
  {
    label: 'BOM',
    items: [{ to: '/bom', icon: Layers, label: 'BOM Management' }]
  },
  {
    label: 'Inventory',
    items: [
      { to: '/inventory/purchases', icon: ShoppingCart, label: 'Purchase Entry' },
      { to: '/inventory', icon: Package, label: 'Stock & Inventory' },
    ]
  },
  {
    label: 'Production',
    items: [{ to: '/production', icon: Factory, label: 'Production Orders' }]
  },
  {
    label: 'Analytics',
    items: [{ to: '/reports', icon: FileBarChart2, label: 'Reports' }]
  },
];

function SidebarContent({ onClose }) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")' }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700">
        <div>
          <div className="font-heading font-black text-xl text-white tracking-tight">PUMP.OS</div>
          <div className="text-xs text-slate-400 font-mono">Manufacturing ERP</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="sidebar-group-label">{group.label}</p>
            {group.items.map(({ to, icon: Icon, label }) => {
              const active = location.pathname === to || location.pathname.startsWith(to + '/');
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={`sidebar-link ${active ? 'active' : ''}`}
                  data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
        {user?.role === 'ADMIN' && (
          <div>
            <p className="sidebar-group-label">Admin</p>
            <Link
              to="/users"
              onClick={onClose}
              className={`sidebar-link ${location.pathname === '/users' ? 'active' : ''}`}
              data-testid="nav-users"
            >
              <Users size={16} strokeWidth={1.5} />
              User Management
            </Link>
          </div>
        )}
      </nav>

      {/* User info */}
      <div className="border-t border-slate-700 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-white">{user?.username}</div>
            <div className="text-xs text-slate-400">{user?.role?.replace('_', ' ')}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors w-full"
          data-testid="logout-button"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    const titles = {
      '/dashboard': 'Dashboard',
      '/master/raw-materials': 'Raw Materials',
      '/master/products': 'Product Models',
      '/bom': 'BOM Management',
      '/inventory/purchases': 'Purchase Entry',
      '/inventory': 'Inventory',
      '/production': 'Production Orders',
      '/reports': 'Reports',
      '/users': 'User Management',
    };
    return titles[path] || 'PUMP.OS';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:flex-shrink-0 z-20">
        <SidebarContent />
      </aside>

      {/* Sidebar — mobile */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 z-40 transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <button
            className="lg:hidden text-slate-500 hover:text-slate-900"
            onClick={() => setSidebarOpen(true)}
            data-testid="mobile-menu-btn"
          >
            <Menu size={22} />
          </button>
          <h1 className="font-heading text-xl font-bold text-slate-900 tracking-tight">{getPageTitle()}</h1>
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-400 font-mono">
            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
