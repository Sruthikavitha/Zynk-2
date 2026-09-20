import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { Users, CreditCard, ChefHat, ShoppingBag, DollarSign, FileText, ChevronRight, Clock, Sparkles } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    activeChefs: 0,
    pendingChefApprovals: 0,
    todaysMeals: 0,
    totalRevenue: 0,
  });
  const [subscriptionDistribution, setSubscriptionDistribution] = useState<{ name: string; count: number }[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  const fetchAdminDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      if (res.data.success) {
        setStats(res.data.stats);
        setSubscriptionDistribution(res.data.subscriptionDistribution || []);
        setRecentOrders(res.data.recentOrders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading admin control console..." />;
  }

  return (
    <div className="space-y-8">
      {/* Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            ZYNK Global Control Center
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Real-time platform statistics, chef approvals, and daily 8 PM operational metrics.
          </p>
        </div>
        <Link to="/admin/chefs">
          <Button variant="primary" size="sm" icon={<ChefHat className="w-4 h-4" />}>
            Review Chef Applications ({stats.pendingChefApprovals})
          </Button>
        </Link>
      </div>

      {/* 6 Key Performance Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Total Users</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{stats.totalUsers}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Active Subscriptions</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{stats.activeSubscriptions}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Active Chefs</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{stats.activeChefs}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ChefHat className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Pending Approvals</p>
            <h3 className="text-3xl font-extrabold text-amber-600">{stats.pendingChefApprovals}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100/60 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Today's Meals</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{stats.todaysMeals}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">Total Platform Revenue</p>
            <h3 className="text-3xl font-extrabold text-emerald-600">₹{stats.totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Subscription Breakdown & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subscription Plan Distribution */}
        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-card space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" /> Plan Distribution
          </h3>

          <div className="space-y-3">
            {subscriptionDistribution.map((item, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100 text-xs">
                <span className="font-bold text-slate-800">{item.name}</span>
                <span className="font-extrabold px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg">
                  {item.count} subscribers
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Platform Orders */}
        <div className="lg:col-span-2 p-6 bg-white rounded-3xl border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-purple-600" /> Live Platform Orders
            </h3>
            <Link to="/admin/orders" className="text-xs font-bold text-indigo-600 hover:underline flex items-center">
              View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="p-3.5 bg-slate-50/70 rounded-2xl flex items-center justify-between text-xs border border-slate-100">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-900">{order.meal.name}</h4>
                  <p className="text-slate-500">Customer: {order.user.name} • Chef: {order.chef.kitchenName}</p>
                </div>
                <span className="font-extrabold uppercase px-2.5 py-1 bg-purple-100 text-purple-800 rounded-md">
                  {order.meal.mealType}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
