import React from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import { Truck, MapPin, CheckCircle, Clock } from 'lucide-react';

export const AdminDeliveryPage: React.FC = () => {
  const deliveries = [
    { id: 'del_1', order: 'Royal South Indian Meals', customer: 'Sharan Kumar', location: 'College (KGiSL Institute)', chef: 'ABC Cloud Kitchen', status: 'OUT_FOR_DELIVERY', partner: 'Ramesh (Bike)' },
    { id: 'del_2', order: 'Paneer Butter Masala', customer: 'Priya Sharma', location: 'Home (Avinashi Road)', chef: 'South Spices Kitchen', status: 'ASSIGNED', partner: 'Karthik (Scooter)' },
    { id: 'del_3', order: 'Chicken Dum Biryani', customer: 'Rahul Dravid', location: 'Work (Tidel Park)', chef: 'ABC Cloud Kitchen', status: 'DELIVERED', partner: 'Suresh (Bike)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Delivery Operations Dispatch</h1>
        <p className="text-xs text-slate-500 mt-1">Optional delivery partner assignment and real-time status tracking.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Meal Order</th>
                <th className="p-4">Customer & Location</th>
                <th className="p-4">Chef Kitchen</th>
                <th className="p-4">Assigned Partner</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deliveries.map((del) => (
                <tr key={del.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{del.order}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{del.customer}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500" /> {del.location}
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-slate-700">{del.chef}</td>
                  <td className="p-4 text-slate-600 font-medium">{del.partner}</td>
                  <td className="p-4">
                    <StatusBadge status={del.status} size="sm" />
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

export default AdminDeliveryPage;
