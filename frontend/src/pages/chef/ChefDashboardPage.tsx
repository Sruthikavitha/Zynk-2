import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Order, Chef } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { Utensils, Coffee, Sun, Moon, MapPin, ShoppingBag, ChevronRight, Clock } from 'lucide-react';

export const ChefDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [chef, setChef] = useState<Chef | null>(null);
  const [stats, setStats] = useState({
    totalMeals: 0,
    breakfastCount: 0,
    lunchCount: 0,
    dinnerCount: 0,
  });
  const [deliveryLocations, setDeliveryLocations] = useState<{ location: string; count: number }[]>([]);
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchChefDashboard();
  }, []);

  const fetchChefDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/chef/dashboard');
      if (res.data.success) {
        setChef(res.data.data.chef);
        setStats(res.data.data.stats);
        setDeliveryLocations(res.data.data.deliveryLocations || []);
        setTodayOrders(res.data.data.todayOrders || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading kitchen partner dashboard..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            {chef?.kitchenName || 'Kitchen Partner Portal'}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            {chef?.kitchenType} • {chef?.location} • FSSAI: {chef?.fssaiNumber || 'Verified'}
          </p>
        </div>
        <Link to="/chef/menu">
          <Button variant="primary" size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold" icon={<Utensils className="w-4 h-4" />}>
            Manage Kitchen Menu
          </Button>
        </Link>
      </div>

      {/* Stats Summary Grid matching reference prompt specs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Meals Today</p>
            <h3 className="text-2xl font-extrabold text-slate-900">{stats.totalMeals}</h3>
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Breakfast</p>
            <h3 className="text-2xl font-extrabold text-slate-900">{stats.breakfastCount}</h3>
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Sun className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Lunch</p>
            <h3 className="text-2xl font-extrabold text-slate-900">{stats.lunchCount}</h3>
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Moon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Dinner</p>
            <h3 className="text-2xl font-extrabold text-slate-900">{stats.dinnerCount}</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Delivery Locations & Today's Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Delivery Locations Grouping */}
        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" /> Delivery Locations
            </h3>
            <span className="text-xs font-semibold text-slate-400">Today</span>
          </div>

          <div className="space-y-3">
            {deliveryLocations.map((loc, idx) => (
              <div key={idx} className="p-3 bg-[#F7F8FC] rounded-2xl flex items-center justify-between border border-slate-100 text-xs">
                <span className="font-bold text-slate-800">{loc.location}</span>
                <span className="font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  {loc.count} meals
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Orders Table */}
        <div className="lg:col-span-2 p-6 bg-white rounded-3xl border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-600" /> Today's Preparation Pipeline
            </h3>
            <Link to="/chef/orders" className="text-xs font-bold text-amber-600 hover:underline flex items-center">
              View All Orders <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {todayOrders.slice(0, 4).map((order) => (
              <div key={order.id} className="p-4 bg-slate-50/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                      {order.mealType}
                    </span>
                    <StatusBadge status={order.status} size="sm" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{order.meal.name}</h4>
                  <p className="text-xs text-slate-500">
                    Customer: {order.user?.name} • Address: {order.deliveryAddress.label} ({order.deliveryAddress.city})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChefDashboardPage;
