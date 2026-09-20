import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Utensils, Clock, MapPin, CheckCircle2, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import Button from '../../components/common/Button';

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-zynk-purple text-xs font-bold shadow-sm">
              <Sparkles className="w-4 h-4" /> Next-Gen Flexible Food Subscriptions
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Good Food • Anytime • <span className="text-zynk-purple">Your Way</span>
            </h1>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-xl">
              Fresh meals. Flexible subscriptions. Delivered from trusted cloud kitchens. Skip, swap, or change delivery address every single day before 8:00 PM.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/register">
                <Button variant="primary" size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                  Get Started Now
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">
                  Existing User Login
                </Button>
              </Link>
            </div>

            {/* Feature Pills */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/80 max-w-md">
              <div>
                <h4 className="font-extrabold text-xl text-slate-900">8:00 PM</h4>
                <p className="text-xs text-slate-500 font-medium">Daily Lock Cutoff</p>
              </div>
              <div>
                <h4 className="font-extrabold text-xl text-slate-900">₹149/wk</h4>
                <p className="text-xs text-slate-500 font-medium">Plans Starting From</p>
              </div>
              <div>
                <h4 className="font-extrabold text-xl text-slate-900">100%</h4>
                <p className="text-xs text-slate-500 font-medium">Verified Cloud Chefs</p>
              </div>
            </div>
          </div>

          {/* Hero Imagery */}
          <div className="relative">
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white">
              <img
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80"
                alt="ZYNK Fresh Healthy Subscription Meal"
                className="w-full h-[440px] object-cover hover:scale-105 transition-transform duration-500"
              />
              {/* Floating Overlay Badge */}
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/60 text-white flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-white">Daily 8 PM Flexibility</h5>
                    <p className="text-xs text-slate-300">Skip • Swap • Change Address</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                  Live Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Innovation Highlights */}
      <section className="bg-white py-16 px-6 border-y border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12 text-center">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Why ZYNK is Revolutionizing Daily Food Subscriptions
            </h2>
            <p className="text-sm text-slate-500">
              No more rigid meal plans. Total control over every breakfast, lunch, and dinner.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-[#F7F8FC] border border-slate-100 space-y-4 text-left hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-2xl bg-zynk-purple text-white flex items-center justify-center font-bold shadow-purple-glow">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">8 PM Daily Cutoff Logic</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enjoy hassle-free flexibility. Modify upcoming meals until 8:00 PM every evening, backed by robust server-side validation.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#F7F8FC] border border-slate-100 space-y-4 text-left hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Skip or Swap Any Meal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Not in the mood for curry? Swap your lunch for Biryani or Paneer Thali, or skip the meal entirely with a single tap.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#F7F8FC] border border-slate-100 space-y-4 text-left hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Dynamic Address Override</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                At college for lunch and home for dinner? Change delivery location per meal without modifying your permanent profile address.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
