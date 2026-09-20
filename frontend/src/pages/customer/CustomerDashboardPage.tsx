import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Order, Subscription, CutoffStatus } from '../../types';
import CutoffBanner from '../../components/common/CutoffBanner';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { Sparkles, Calendar, Utensils, Clock, ChevronRight, MapPin, ChefHat } from 'lucide-react';

export const CustomerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [todaysMeals, setTodaysMeals] = useState<Order[]>([]);
  const [nextMeal, setNextMeal] = useState<Order | null>(null);
  const [cutoffStatus, setCutoffStatus] = useState<CutoffStatus | undefined>(undefined);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customer/dashboard');
      if (res.data.success) {
        setActiveSubscription(res.data.data.activeSubscription);
        setTodaysMeals(res.data.data.todaysMeals || []);
        setNextMeal(res.data.data.nextMeal);
        setCutoffStatus(res.data.data.cutoffStatus);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading customer dashboard..." />;
  }

  return (
    <div className="space-y-8">
      {/* Top Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Good Morning, {user?.name || 'Customer'} 👋
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Here is your daily meal summary and flexible subscription control.
          </p>
        </div>
        <Link to="/customer/meals">
          <Button variant="primary" icon={<Utensils className="w-4 h-4" />}>
            Manage Today's Meals
          </Button>
        </Link>
      </div>

      {/* 8 PM Cutoff Banner */}
      <CutoffBanner cutoffStatus={cutoffStatus} />

      {/* Hero Banner Card matching Reference UI */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zynk-purple via-indigo-600 to-indigo-900 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Premium Daily Nutrition
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Fuel Your Day with Fresh & Healthy Meals
          </h2>
          <p className="text-xs md:text-sm text-purple-100 leading-relaxed">
            Crafted by certified cloud chefs and delivered straight to your home or college campus.
          </p>
          <div className="pt-2">
            <Link to="/customer/subscriptions/plans">
              <Button variant="secondary" size="md" className="bg-white text-zynk-purple hover:bg-slate-100">
                View Plans <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Subscription Summary & Next Meal Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Subscription Status */}
        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Calendar className="w-4 h-4 text-zynk-purple" /> Active Subscription
            </div>
            {activeSubscription ? (
              <StatusBadge status={activeSubscription.status} size="sm" />
            ) : (
              <StatusBadge status="INACTIVE" size="sm" />
            )}
          </div>

          {activeSubscription ? (
            <div className="space-y-3">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">{activeSubscription.plan.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{activeSubscription.plan.description}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-slate-500">Weekly Price:</span>
                <span className="font-bold text-slate-900">₹{activeSubscription.plan.price}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Valid Until:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(activeSubscription.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 space-y-3">
              <p className="text-xs text-slate-500">You don't have an active subscription yet.</p>
              <Link to="/customer/subscriptions/plans">
                <Button variant="primary" size="sm">Subscribe Now</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Next Meal Highlight Card */}
        <div className="lg:col-span-2 p-6 bg-white rounded-3xl border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Utensils className="w-4 h-4 text-emerald-600" /> Next Scheduled Meal
            </div>
            <Link to="/customer/meals" className="text-xs font-bold text-zynk-purple hover:underline flex items-center">
              View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {nextMeal ? (
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-[#F7F8FC] rounded-2xl border border-slate-100">
              <img
                src={nextMeal.meal.imageUrl}
                alt={nextMeal.meal.name}
                className="w-24 h-24 rounded-xl object-cover shrink-0 shadow-sm"
              />
              <div className="flex-1 space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wide px-2.5 py-0.5 bg-purple-100 text-zynk-purple rounded-md">
                    {nextMeal.mealType}
                  </span>
                  <StatusBadge status={nextMeal.status} size="sm" />
                </div>
                <h4 className="font-bold text-base text-slate-900">{nextMeal.meal.name}</h4>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Today • {nextMeal.mealType === 'BREAKFAST' ? '8:30 AM' : nextMeal.mealType === 'LUNCH' ? '12:30 PM' : '7:30 PM'}
                  </span>
                  <span className="flex items-center gap-1">
                    <ChefHat className="w-3.5 h-3.5 text-slate-400" /> {nextMeal.chef.kitchenName}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {nextMeal.deliveryAddress.label} ({nextMeal.deliveryAddress.city})
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">
              No upcoming scheduled meals for today.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboardPage;
