import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });

      if (res.data.success) {
        const { token, user } = res.data;
        login(token, user);
        showToast('success', 'Welcome Back!', `Logged in as ${user.name}`);

        // Redirect based on role
        if (user.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (user.role === 'CHEF') {
          if (user.chefProfile?.approvalStatus === 'APPROVED') {
            navigate('/chef/dashboard');
          } else {
            navigate('/chef/application-status');
          }
        } else if (user.role === 'DELIVERY_PARTNER') {
          navigate('/delivery/dashboard');
        } else {
          navigate('/customer/find-kitchen');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      showToast('error', 'Login Error', err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-zynk-purple to-indigo-500 text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-purple-glow">
            Z
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign In to ZYNK</h2>
          <p className="text-xs text-slate-500">Access your flexible food subscription dashboard</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. customer@zynk.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            required
          />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-zynk-purple focus:ring-zynk-purple border-slate-300"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-zynk-purple font-semibold hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button variant="primary" size="lg" className="w-full" loading={loading} icon={<LogIn className="w-4 h-4" />}>
            Sign In
          </Button>
        </form>

        {/* Demo Credentials Helper Box */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1.5">
          <p className="font-bold text-slate-800">Quick Demo Logins:</p>
          <div className="grid grid-cols-3 gap-1 text-[11px]">
            <button
              onClick={() => { setEmail('customer@zynk.com'); setPassword('customer123'); }}
              className="px-2 py-1 bg-white border border-slate-200 rounded font-semibold text-slate-700 hover:bg-slate-100"
            >
              Customer
            </button>
            <button
              onClick={() => { setEmail('chef@zynk.com'); setPassword('chef123'); }}
              className="px-2 py-1 bg-white border border-slate-200 rounded font-semibold text-slate-700 hover:bg-slate-100"
            >
              Chef
            </button>
            <button
              onClick={() => { setEmail('admin@zynk.com'); setPassword('admin123'); }}
              className="px-2 py-1 bg-white border border-slate-200 rounded font-semibold text-slate-700 hover:bg-slate-100"
            >
              Admin
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-zynk-purple hover:underline">
            Register as Customer
          </Link>
          <span className="mx-2 text-slate-300">•</span>
          <Link to="/chef/register" className="font-bold text-amber-600 hover:underline">
            Join as Chef
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
