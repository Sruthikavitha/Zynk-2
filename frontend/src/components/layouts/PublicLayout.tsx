import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Sparkles, UtensilsCrossed, ArrowRight } from 'lucide-react';
import Button from '../common/Button';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col text-slate-800">
      {/* Public Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-zynk-purple to-indigo-500 flex items-center justify-center font-extrabold text-xl text-white shadow-purple-glow">
              Z
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 font-sans">
                ZYNK
              </span>
              <p className="text-[10px] text-zynk-purple font-semibold tracking-wide">
                Good Food • Anytime • Your Way
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-[#11162A] text-slate-400 py-12 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-zynk-purple text-white font-bold flex items-center justify-center text-sm">
                Z
              </div>
              <span className="font-bold text-lg text-white">ZYNK</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Flexible food subscription platform connecting food lovers with cloud kitchens with 8 PM daily cutoff management.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-3">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/login" className="hover:text-white transition-colors">Customer Login</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Customer Sign Up</Link></li>
              <li><Link to="/chef/register" className="hover:text-white transition-colors">Register as Chef</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-3">Portals</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/customer/dashboard" className="hover:text-white transition-colors">Customer Portal</Link></li>
              <li><Link to="/chef/dashboard" className="hover:text-white transition-colors">Chef Kitchen Portal</Link></li>
              <li><Link to="/admin/login" className="hover:text-white transition-colors">Admin Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-3">Contact & Support</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Coimbatore, Tamil Nadu, India<br />
              Support: support@zynk.com<br />
              8:00 PM Daily Cutoff System
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} ZYNK Flexible Food Subscription Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
