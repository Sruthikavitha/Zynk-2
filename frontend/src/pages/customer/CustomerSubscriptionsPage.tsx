import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Subscription } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { Calendar, CreditCard, Sparkles, ChevronRight } from 'lucide-react';

export const CustomerSubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customer/subscriptions');
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
    return <LoadingSpinner label="Fetching your subscriptions..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Subscriptions</h1>
          <p className="text-xs text-slate-500 mt-1">View your current active plan and billing history.</p>
        </div>
        <Link to="/customer/subscriptions/plans">
          <Button variant="primary" size="sm" icon={<Sparkles className="w-4 h-4" />}>
            Upgrade / Change Plan
          </Button>
        </Link>
      </div>

      {subscriptions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800">No Active Subscriptions</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Choose a plan to get daily fresh meals delivered from trusted cloud kitchens.
          </p>
          <Link to="/customer/subscriptions/plans">
            <Button variant="primary" size="sm">Browse Subscription Plans</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="p-6 bg-white rounded-3xl border border-slate-100 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-extrabold text-lg text-slate-900">{sub.plan.name}</h3>
                  <StatusBadge status={sub.status} size="sm" />
                </div>
                <p className="text-xs text-slate-500">{sub.plan.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                  <span>Start: <strong>{new Date(sub.startDate).toLocaleDateString()}</strong></span>
                  <span>End: <strong>{new Date(sub.endDate).toLocaleDateString()}</strong></span>
                  <span>Razorpay ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">{sub.razorpayOrderId || 'N/A'}</code></span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-extrabold text-slate-900">₹{sub.amount}</div>
                <span className="text-[11px] text-slate-400 font-medium">Weekly Subscription</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerSubscriptionsPage;
