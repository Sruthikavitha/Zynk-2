import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { ChefHat, Mail, Phone, Lock, MapPin, Building2, FileCheck, ArrowRight } from 'lucide-react';

export const ChefRegisterPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [kitchenName, setKitchenName] = useState('');
  const [kitchenType, setKitchenType] = useState('Cloud Kitchen');
  const [location, setLocation] = useState('Coimbatore');
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password || !kitchenName || !location) {
      setError('Please fill in all required kitchen application fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Register base user as CHEF
      const regRes = await api.post('/auth/register', {
        name,
        email,
        phone,
        password,
        role: 'CHEF',
      });

      if (regRes.data.success) {
        const { token, user } = regRes.data;
        login(token, user);

        // 2. Submit chef kitchen application
        const chefRes = await api.post('/chef/register', {
          kitchenName,
          kitchenType,
          location,
          fssaiNumber,
          description,
        });

        if (chefRes.data.success) {
          showToast('success', 'Application Submitted', 'Admin will review your cloud kitchen application.');
          navigate('/chef/application-status');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Chef registration failed.');
      showToast('error', 'Registration Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6 my-8">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center mx-auto shadow-md">
            <ChefHat className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Register as Kitchen Partner</h2>
          <p className="text-xs text-slate-500">Connect your cloud kitchen or home kitchen with ZYNK subscribers</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              placeholder="Chef Rajesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email Address *"
              type="email"
              placeholder="chef@zynk.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone Number *"
              type="tel"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={<Phone className="w-4 h-4" />}
              required
            />
            <Input
              label="Account Password *"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Kitchen Name *"
              placeholder="e.g. ABC Cloud Kitchen"
              value={kitchenName}
              onChange={(e) => setKitchenName(e.target.value)}
              icon={<Building2 className="w-4 h-4" />}
              required
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Kitchen Type *
              </label>
              <select
                value={kitchenType}
                onChange={(e) => setKitchenType(e.target.value)}
                className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Cloud Kitchen">Cloud Kitchen</option>
                <option value="Home Kitchen">Home Kitchen</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="City / Location *"
              placeholder="e.g. Coimbatore"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              icon={<MapPin className="w-4 h-4" />}
              required
            />
            <Input
              label="FSSAI License Number (Optional)"
              placeholder="12421003000456"
              value={fssaiNumber}
              onChange={(e) => setFssaiNumber(e.target.value)}
              icon={<FileCheck className="w-4 h-4" />}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Kitchen Description & Menu Specialties
            </label>
            <textarea
              rows={3}
              placeholder="Specializing in Tamil Nadu home food such as idly, pongal, sambar sadham, dosa, and healthy home-style meals..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-200 p-3.5 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <Button variant="primary" size="lg" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold" loading={loading} icon={<ArrowRight className="w-4 h-4" />}>
            Submit Kitchen Application
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChefRegisterPage;
