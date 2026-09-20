import React, { useState } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useNotification } from '../../context/NotificationContext';
import { Clock, ShieldCheck, Key } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { showToast } = useNotification();
  const [cutoffTime, setCutoffTime] = useState('20:00');
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('success', 'Settings Saved', 'System 8 PM cutoff time configuration updated.');
    }, 600);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Configuration & Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Configure daily cutoff thresholds and backend API parameters.</p>
      </div>

      <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-card space-y-6">
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" /> Daily Cutoff Lock Settings
            </h3>

            <Input
              label="System Default Cutoff Time (24h format) *"
              type="text"
              value={cutoffTime}
              onChange={(e) => setCutoffTime(e.target.value)}
              helperText="Default is 20:00 (8:00 PM). All skip/swap/address modification requests past this hour are rejected by the backend."
              required
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600" /> Gateway Integration Mode
            </h3>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>Razorpay Gateway Mode:</span>
                <span className="text-emerald-600">TEST / DEMO SIMULATION</span>
              </div>
              <p className="text-slate-500">
                Keys loaded from backend <code>.env</code> (<code>RAZORPAY_KEY_ID</code>, <code>RAZORPAY_KEY_SECRET</code>).
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button variant="primary" size="md" loading={saving}>
              Save Configuration
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
