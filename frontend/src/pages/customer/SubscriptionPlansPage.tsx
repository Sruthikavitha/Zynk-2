import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { SubscriptionPlan } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { Check, Sparkles, ShieldCheck, Zap, CreditCard } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const SubscriptionPlansPage: React.FC = () => {
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customer/plans');
      if (res.data.success) {
        setPlans(res.data.plans || []);
      }
    } catch (err: any) {
      showToast('error', 'Failed to load plans', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setPurchasingPlanId(plan.id);
    try {
      // 1. Create Razorpay order on backend
      const res = await api.post('/payments/create-order', { planId: plan.id });
      if (!res.data.success) {
        throw new Error(res.data.error || 'Failed to initialize payment.');
      }

      const { razorpayOrderId, amountInPaise, keyId } = res.data;

      // Check if Razorpay SDK script loaded in browser
      if (window.Razorpay && !keyId.startsWith('rzp_test_zynk_key')) {
        const options = {
          key: keyId,
          amount: amountInPaise,
          currency: 'INR',
          name: 'ZYNK Food Subscriptions',
          description: `Subscribe to ${plan.name}`,
          order_id: razorpayOrderId,
          handler: async (response: any) => {
            await verifyPaymentBackend(
              plan.id,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
          },
          theme: {
            color: '#5B3DF5',
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Simulated test mode backend payment handler
        showToast('info', 'Razorpay Test Simulation', 'Verifying test subscription activation...');
        setTimeout(async () => {
          await verifyPaymentBackend(
            plan.id,
            razorpayOrderId,
            `pay_sim_${Date.now()}`
          );
        }, 1000);
      }
    } catch (err: any) {
      showToast('error', 'Payment Failed', err.message);
      setPurchasingPlanId(null);
    }
  };

  const verifyPaymentBackend = async (
    planId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature?: string
  ) => {
    try {
      const res = await api.post('/payments/verify', {
        planId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      if (res.data.success) {
        showToast('success', 'Subscription Activated!', 'Your plan has been activated successfully.');
        navigate('/customer/dashboard');
      }
    } catch (err: any) {
      showToast('error', 'Payment Verification Failed', err.message);
    } finally {
      setPurchasingPlanId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading subscription plans..." />;
  }

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="px-3 py-1 bg-indigo-50 text-zynk-purple text-xs font-bold rounded-full border border-indigo-100">
          Transparent Pricing
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Flexible Food Subscription Plans
        </h1>
        <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
          Select a weekly meal package tailored for your lifestyle. Skip or swap any meal before 8:00 PM daily.
        </p>
      </div>

      {/* Plans Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, idx) => {
          const isPopular = plan.name.toLowerCase().includes('regular');
          let parsedFeatures: string[] = [];
          try {
            parsedFeatures = JSON.parse(plan.features);
          } catch {
            parsedFeatures = [plan.features];
          }

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-3xl p-8 border transition-all duration-300 flex flex-col justify-between ${
                isPopular
                  ? 'border-zynk-purple shadow-xl ring-2 ring-zynk-purple/20 scale-105'
                  : 'border-slate-200 shadow-card hover:shadow-card-hover'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-zynk-purple text-white text-[11px] font-extrabold px-4 py-1 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Most Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="font-extrabold text-xl text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">₹{plan.price}</span>
                  <span className="text-xs font-semibold text-slate-500">/ week</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl text-xs font-semibold text-slate-700 flex items-center justify-between border border-slate-100">
                  <span>Included Meals:</span>
                  <span className="text-zynk-purple">{plan.mealOptions}</span>
                </div>

                <ul className="space-y-3 pt-2 text-xs">
                  {parsedFeatures.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2.5 text-slate-700 font-medium">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs">
                        ✓
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Button
                  variant={isPopular ? 'primary' : 'outline'}
                  size="lg"
                  className="w-full"
                  onClick={() => handleSubscribe(plan)}
                  loading={purchasingPlanId === plan.id}
                  icon={<CreditCard className="w-4 h-4" />}
                >
                  Subscribe via Razorpay
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionPlansPage;
