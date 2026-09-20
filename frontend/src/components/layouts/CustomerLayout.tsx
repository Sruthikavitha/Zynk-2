import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Calendar,
  UtensilsCrossed,
  History,
  MapPin,
  User as UserIcon,
  LogOut,
  Menu as MenuIcon,
  X,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export const CustomerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Home', path: '/customer/dashboard', icon: <Home className="w-5 h-5" /> },
    { label: 'Subscriptions', path: '/customer/subscriptions', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Upcoming Meals', path: '/customer/meals', icon: <UtensilsCrossed className="w-5 h-5" /> },
    { label: 'Meal History', path: '/customer/history', icon: <History className="w-5 h-5" /> },
    { label: 'Address Book', path: '/customer/address', icon: <MapPin className="w-5 h-5" /> },
    { label: 'Profile', path: '/customer/profile', icon: <UserIcon className="w-5 h-5" /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex text-slate-800">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Dark Navy Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#11162A] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo & Tagline */}
          <div className="p-6 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <Link to="/customer/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-zynk-purple to-indigo-400 flex items-center justify-center font-extrabold text-xl shadow-purple-glow">
                  Z
                </div>
                <div>
                  <h1 className="font-extrabold text-xl tracking-tight text-white font-sans">
                    ZYNK
                  </h1>
                  <p className="text-[10px] text-purple-300 font-medium tracking-wide">
                    Good Food • Anytime • Your Way
                  </p>
                </div>
              </Link>
              <button
                className="lg:hidden text-slate-400 hover:text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/customer/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-zynk-purple text-white shadow-purple-glow'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-purple-200" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 8 PM Cutoff Indicator in Sidebar Footer */}
        <div className="p-4 space-y-3">
          <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
              <Clock className="w-4 h-4" /> 8:00 PM Daily Cutoff
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Skip, Swap, or Change Address before 8 PM daily for next cycle.
            </p>
          </div>

          {/* User profile & Logout */}
          <div className="p-3 bg-slate-900/60 rounded-2xl flex items-center justify-between border border-slate-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-zynk-purple rounded-full border border-indigo-100">
              Customer Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/customer/subscriptions/plans"
              className="hidden sm:inline-flex items-center gap-2 text-xs font-bold px-4 py-2 bg-gradient-to-r from-zynk-purple to-indigo-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" /> View Plans
            </Link>
            <div className="w-9 h-9 rounded-full bg-zynk-purple text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;
