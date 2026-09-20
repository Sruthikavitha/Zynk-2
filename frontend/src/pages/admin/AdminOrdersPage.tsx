import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Order } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/orders');
      if (res.data.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Fetching platform orders..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Platform Orders Overview</h1>
        <p className="text-xs text-slate-500 mt-1">Consolidated view of all meal dispatches across all kitchen partners.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Meal & Type</th>
                <th className="p-4">Chef Kitchen</th>
                <th className="p-4">Delivery Date</th>
                <th className="p-4">Address</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{order.user?.name}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{order.meal?.name}</div>
                    <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                      {order.mealType}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-700">{order.chef?.kitchenName}</td>
                  <td className="p-4 text-slate-600">{new Date(order.deliveryDate).toLocaleDateString()}</td>
                  <td className="p-4 text-slate-600">{order.deliveryAddress?.label} ({order.deliveryAddress?.city})</td>
                  <td className="p-4">
                    <StatusBadge status={order.status} size="sm" />
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

export default AdminOrdersPage;
