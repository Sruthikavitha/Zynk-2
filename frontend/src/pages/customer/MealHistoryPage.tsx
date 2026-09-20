import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Order } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { History, Calendar, MapPin, ChefHat } from 'lucide-react';

export const MealHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customer/history');
      if (res.data.success) {
        setHistory(res.data.history || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((item) => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  if (loading) {
    return <LoadingSpinner label="Fetching your meal history..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Meal History</h1>
          <p className="text-xs text-slate-500 mt-1">Complete log of your delivered, skipped, and swapped meals.</p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm text-xs font-semibold">
          {['ALL', 'DELIVERED', 'SKIPPED', 'CONFIRMED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filter === status
                  ? 'bg-zynk-purple text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800">No Meal History Records</h3>
          <p className="text-xs text-slate-500 mt-1">No orders match the selected filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredHistory.map((order) => (
              <div key={order.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <img
                    src={order.meal.imageUrl}
                    alt={order.meal.name}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                        {order.mealType}
                      </span>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{order.meal.name}</h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(order.deliveryDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <ChefHat className="w-3.5 h-3.5 text-slate-400" /> {order.chef.kitchenName}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {order.deliveryAddress.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-right font-medium text-slate-500">
                  Logged on {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MealHistoryPage;
