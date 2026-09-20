import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import { User as UserIcon, Mail, Phone, ShieldCheck, LogOut } from 'lucide-react';

export const CustomerProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your account credentials and personal preferences.</p>
      </div>

      <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-card space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-zynk-purple to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">{user?.name}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2.5 py-0.5 bg-indigo-50 text-zynk-purple rounded-full">
              {user?.role} ACCOUNT
            </span>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl">
            <span className="text-slate-500 flex items-center gap-2 font-medium">
              <Mail className="w-4 h-4 text-slate-400" /> Email Address
            </span>
            <span className="font-bold text-slate-800">{user?.email}</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl">
            <span className="text-slate-500 flex items-center gap-2 font-medium">
              <Phone className="w-4 h-4 text-slate-400" /> Phone Number
            </span>
            <span className="font-bold text-slate-800">{user?.phone || '+91 9876543210'}</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl">
            <span className="text-slate-500 flex items-center gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Account Status
            </span>
            <span className="font-bold text-emerald-600 uppercase">ACTIVE & VERIFIED</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button variant="danger" size="sm" onClick={logout} icon={<LogOut className="w-4 h-4" />}>
            Sign Out of ZYNK
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfilePage;
