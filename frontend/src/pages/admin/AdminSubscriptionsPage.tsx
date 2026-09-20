import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Subscription } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const AdminSubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/subscriptions');
      if (res.data.success) {
        setSubscriptions(res.data.subscriptions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Fetching platform subscriptions..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">All Subscriptions</h1>
        <p className="text-xs text-slate-500 mt-1">Global audit log of active and historic customer plan subscriptions.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Plan Name</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Start Date</th>
                <th className="p-4">End Date</th>
                <th className="p-4">Razorpay Order</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{sub.user?.name || sub.userId}</td>
                  <td className="p-4 font-semibold text-zynk-purple">{sub.plan.name}</td>
                  <td className="p-4 font-extrabold text-slate-900">₹{sub.amount}</td>
                  <td className="p-4 text-slate-600">{new Date(sub.startDate).toLocaleDateString()}</td>
                  <td className="p-4 text-slate-600">{new Date(sub.endDate).toLocaleDateString()}</td>
                  <td className="p-4 font-mono text-slate-500">{sub.razorpayOrderId || 'N/A'}</td>
                  <td className="p-4">
                    <StatusBadge status={sub.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptionsPage;
