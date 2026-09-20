import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Order } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { ShoppingBag, ChefHat, MapPin, CheckCircle2, Clock } from 'lucide-react';

export const ChefOrdersPage: React.FC = () => {
  const { showToast } = useNotification();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/chef/orders');
      if (res.data.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err: any) {
      showToast('error', 'Error Loading Orders', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await api.put(`/chef/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        showToast('success', 'Status Updated', `Order status changed to ${newStatus}`);
        fetchOrders();
      }
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Fetching kitchen order pipeline..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Kitchen Orders Pipeline</h1>
        <p className="text-xs text-slate-500 mt-1">Manage and update preparation states for today's orders.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        <div className="divide-y divide-slate-100">
          {orders.map((order) => (
            <div key={order.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded">
                    {order.mealType}
                  </span>
                  <StatusBadge status={order.status} size="sm" />
                </div>
                <h3 className="font-bold text-base text-slate-900">{order.meal.name}</h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    Customer: {order.user?.name} ({order.user?.phone})
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {new Date(order.deliveryDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {order.deliveryAddress.label}: {order.deliveryAddress.street}, {order.deliveryAddress.city}
                  </span>
                </div>
              </div>

              {/* Chef Status Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {order.status === 'CONFIRMED' && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                    loading={updatingId === order.id}
                    onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                  >
                    Mark as Preparing
                  </Button>
                )}

                {order.status === 'PREPARING' && (
                  <Button
                    size="sm"
                    variant="success"
                    loading={updatingId === order.id}
                    onClick={() => handleUpdateStatus(order.id, 'PREPARED')}
                  >
                    Mark as Prepared
                  </Button>
                )}

                {order.status === 'PREPARED' && (
                  <Button
                    size="sm"
                    variant="success"
                    loading={updatingId === order.id}
                    onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                  >
                    Mark as Completed
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChefOrdersPage;
