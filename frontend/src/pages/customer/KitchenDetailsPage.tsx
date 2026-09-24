import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Star, MapPin, Check, ChefHat, UtensilsCrossed, CalendarDays, Sparkles, CreditCard, ShieldCheck, Zap, ArrowLeft, Info } from 'lucide-react';
import { SubscriptionPlan } from '../../types';
import { createPaymentOrder, openRazorpayCheckout, verifyPaymentSignature } from '../../services/paymentService';

const MENU_CATEGORIES = ['BREAKFAST', 'LUNCH', 'DINNER'];

const mealLabels: Record<string, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
};

export const KitchenDetailsPage: React.FC = () => {
  const { kitchenId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [kitchen, setKitchen] = useState<any>(null);
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>(['BREAKFAST', 'LUNCH', 'DINNER']);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [serviceability, setServiceability] = useState<{ serviceable: boolean; message: string } | null>(null);
  const [menuFilter, setMenuFilter] = useState('ALL');
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Real Subscription Plans state
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [subscribing, setSubscribing] = useState<boolean>(false);

  useEffect(() => {
    if (!kitchenId) return;
    const fetchKitchen = async () => {
      try {
        const kitchenRes = await api.get(`/customer/kitchens/${kitchenId}`);
        const menuRes = await api.get(`/customer/kitchens/${kitchenId}/menu`);
        const addrRes = await api.get('/customer/addresses');
        const plansRes = await api.get('/customer/plans');

        if (kitchenRes.data.success) setKitchen(kitchenRes.data.kitchen);
        if (menuRes.data.success) setMenu(menuRes.data.meals || []);

        // Load real subscription plans from database
        if (plansRes.data.success && plansRes.data.plans?.length) {
          setPlans(plansRes.data.plans);
          setSelectedPlanId(plansRes.data.plans[0].id);
        }

        if (addrRes.data.success && addrRes.data.addresses?.length) {
          setAddresses(addrRes.data.addresses);
          const defaultAddress = addrRes.data.addresses.find((addr: any) => addr.isDefault) || addrRes.data.addresses[0];
          setSelectedAddress(defaultAddress.id);
          const serviceCheck = await api.post(`/customer/kitchens/${kitchenId}/serviceability`, {
            district: defaultAddress.city,
            city: defaultAddress.city,
            area: defaultAddress.street,
          });
          setServiceability({
            serviceable: !!serviceCheck.data.serviceable,
            message: serviceCheck.data.message || 'No service data available.',
          });
        }
      } catch (err: any) {
        showToast('error', 'Kitchen load failed', err.message || 'Unable to load kitchen');
      } finally {
        setLoading(false);
      }
    };

    fetchKitchen();
  }, [kitchenId]);

  const handleMealTypeToggle = (mealType: string) => {
    setSelectedMealTypes((current) =>
      current.includes(mealType) ? current.filter((item) => item !== mealType) : [...current, mealType]
    );
  };

  useEffect(() => {
    if (!selectedAddress || !kitchenId) return;
    const selected = addresses.find((address) => address.id === selectedAddress);
    if (!selected) return;
    setServiceability(null);
    api.post(`/customer/kitchens/${kitchenId}/serviceability`, {
      district: selected.city,
      city: selected.city,
      area: selected.street,
    }).then((res) => setServiceability({
      serviceable: !!res.data.serviceable,
      message: res.data.message || 'No service data available.',
    })).catch(() => setServiceability({ serviceable: false, message: 'Unable to validate this address right now.' }));
  }, [selectedAddress, addresses, kitchenId]);

  const handleServiceabilityCheck = async () => {
    if (!selectedAddress) return;
    const selected = addresses.find((address) => address.id === selectedAddress);
    if (!selected) return;

    try {
      const res = await api.post(`/customer/kitchens/${kitchenId}/serviceability`, {
        district: selected.city,
        city: selected.city,
        area: selected.street,
      });
      setServiceability({
        serviceable: !!res.data.serviceable,
        message: res.data.message || 'No service data available.',
      });
    } catch (err: any) {
      showToast('error', 'Service check failed', err.message || 'Unable to validate delivery area.');
    }
  };

  const handlePayment = async () => {
    if (!user) {
      showToast('error', 'Login required', 'Please sign in as a customer to subscribe.');
      navigate('/login');
      return;
    }

    if (!selectedMealTypes.length) {
      showToast('error', 'Choose a meal slot', 'Select at least one meal before subscribing.');
      return;
    }

    if (!selectedPlanId) {
      showToast('error', 'No plan selected', 'Please select a subscription plan.');
      return;
    }

    if (addresses.length > 0 && serviceability && !serviceability.serviceable) {
      showToast('error', 'Address not serviceable', 'This kitchen does not deliver to the selected address.');
      return;
    }

    setSubscribing(true);

    try {
      // 1. Create real Razorpay order on backend via Orders API
      const orderData = await createPaymentOrder(selectedPlanId);

      // 2. Open real Razorpay Checkout modal
      await openRazorpayCheckout({
        orderData,
        user,
        kitchenName: kitchen?.kitchenName || 'ZYNK Kitchen',
        onSuccess: () => {
          setSubscribing(false);
          showToast('success', 'Subscription activated!', 'Your kitchen subscription has been activated successfully.');
          navigate('/customer/subscriptions');
        },
        onDismiss: () => {
          setSubscribing(false);
          showToast('error', 'Payment cancelled', 'You closed the payment checkout. Subscription was not activated.');
        },
        onError: (err) => {
          setSubscribing(false);
          showToast('error', 'Payment failed', err.message || 'Payment processing failed.');
        },
      });
    } catch (err: any) {
      setSubscribing(false);
      showToast('error', 'Payment setup failed', err.message || 'Unable to initiate payment.');
    }
  };

  // Dev fallback simulation handler to test full flow without live credentials
  const handleSimulatePaymentDev = async () => {
    if (!selectedPlanId) {
      showToast('error', 'No plan selected', 'Please select a subscription plan.');
      return;
    }

    setSubscribing(true);

    try {
      // 1. Create order on backend
      const orderData = await createPaymentOrder(selectedPlanId);

      // 2. Simulate payment verification
      const simPaymentId = `pay_sim_${Date.now()}`;
      const verifyRes = await verifyPaymentSignature({
        planId: selectedPlanId,
        razorpayOrderId: orderData.razorpayOrderId,
        razorpayPaymentId: simPaymentId,
        razorpaySignature: 'simulated_signature',
      });

      if (verifyRes.success) {
        showToast('success', 'Subscription activated!', 'Dev Mode: Simulated payment verified and subscription activated successfully.');
        navigate('/customer/subscriptions');
      }
    } catch (err: any) {
      showToast('error', 'Dev simulation failed', err.message || 'Simulation failed.');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading kitchen profile..." />;
  if (!kitchen) return <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Kitchen not found.</div>;

  const groupedMenu = MENU_CATEGORIES.map((type) => ({
    type,
    items: menu.filter((item) => item.mealType === type),
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate('/customer/find-kitchen')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-zynk-purple hover:text-zynk-purple"><ArrowLeft className="h-4 w-4" /> Back to kitchens</button>
          <div className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zynk-purple md:flex">
          <span>District</span>
          <span>→</span>
          <span className="text-slate-900">Kitchen</span>
          <span>→</span>
          <span className="text-slate-500">Menu</span>
          <span>→</span>
          <span className="text-slate-500">Subscription</span>
          <span>→</span>
          <span className="text-slate-500">Payment</span>
          </div>
        </div>
      </div>

      <div className="rounded-[30px] bg-white border border-slate-200 p-6 shadow-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-zynk-purple">Kitchen Profile</p>
            <h1 className="mt-3 text-3xl font-extrabold text-slate-900">{kitchen.kitchenName}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-rose-500" /> {kitchen.area || 'Peelamedu'}, {kitchen.city || kitchen.district || 'Coimbatore'}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <Sparkles className="h-4 w-4 text-amber-500" /> {kitchen.cuisine || 'Tamil Nadu Homemade Food'}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
            <Star className="h-4 w-4 fill-current" /> {kitchen.rating ?? 4.8}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center gap-3">
              <ChefHat className="h-5 w-5 text-zynk-purple" />
              <h2 className="text-xl font-extrabold text-slate-900">About the Kitchen</h2>
            </div>
            <p className="text-sm leading-7 text-slate-600">{kitchen.description || 'Authentic Tamil Nadu home food prepared fresh with traditional recipes, balanced nutrition and warm hospitality.'}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {(kitchen.serviceAreas && Array.isArray(kitchen.serviceAreas) ? kitchen.serviceAreas : ['Peelamedu', 'Gandhipuram', 'RS Puram']).slice(0, 5).map((area: string) => (
                <span key={area} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">{area}</span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center gap-3">
              <UtensilsCrossed className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl font-extrabold text-slate-900">Today's Menu</h2>
            </div>

            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              <button type="button" onClick={() => setMenuFilter('ALL')} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${menuFilter === 'ALL' ? 'bg-zynk-purple text-white' : 'border border-slate-200 text-slate-600'}`}>All menu</button>
              {MENU_CATEGORIES.map((type) => <button key={type} type="button" onClick={() => setMenuFilter(type)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${menuFilter === type ? 'bg-zynk-purple text-white' : 'border border-slate-200 text-slate-600'}`}>{mealLabels[type]}</button>)}
            </div>

            <div className="space-y-5">
              {groupedMenu.filter((group) => menuFilter === 'ALL' || group.type === menuFilter).map((group) => (
                <div key={group.type}>
                  <h3 className="mb-3 text-sm font-extrabold uppercase tracking-[0.12em] text-slate-500">{mealLabels[group.type] || group.type}</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.items.length ? group.items.map((item: any) => (
                      <button key={item.id} type="button" onClick={() => setExpandedMealId(expandedMealId === item.id ? null : item.id)} className={`w-full rounded-2xl border p-3 text-left transition ${expandedMealId === item.id ? 'border-zynk-purple bg-zynk-purple/5 shadow-sm' : 'border-slate-200 bg-slate-50 hover:border-zynk-purple/50'}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-800">{item.name}</span>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{item.mealType}</span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">{expandedMealId === item.id ? (item.description || 'Freshly made with traditional Tamil ingredients.') : 'Tap to view meal details'}</div>
                      </button>
                    )) : (
                      <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">No {mealLabels[group.type].toLowerCase()} menu items available.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Choose Subscription Plan</h2>
                <p className="mt-1 text-xs text-slate-500">Select a real subscription plan for this kitchen</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                Fresh Daily
              </span>
            </div>

            {/* Plans Selection List */}
            <div className="mt-4 space-y-3">
              {plans.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                  Loading subscription plans...
                </div>
              ) : (
                plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  let parsedFeatures: string[] = [];
                  try {
                    parsedFeatures = JSON.parse(plan.features || '[]');
                  } catch {
                    parsedFeatures = [];
                  }

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`cursor-pointer rounded-2xl border p-4 transition ${
                        isSelected
                          ? 'border-zynk-purple bg-zynk-purple/5 shadow-sm ring-2 ring-zynk-purple/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900">{plan.name}</span>
                            {isSelected && (
                              <span className="rounded-full bg-zynk-purple px-2 py-0.5 text-[10px] font-bold text-white">
                                Selected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{plan.description}</p>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <span className="text-lg font-black text-slate-900">₹{plan.price}</span>
                          <span className="block text-[10px] font-medium text-slate-400">/{plan.durationDays} days</span>
                        </div>
                      </div>

                      {parsedFeatures.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                          {parsedFeatures.slice(0, 4).map((feat, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                            >
                              ✓ {feat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Meal Slot Customization */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Meal Types Included</h3>
              <div className="mt-3 space-y-2">
                {MENU_CATEGORIES.map((mealType) => (
                  <button
                    key={mealType}
                    type="button"
                    onClick={() => handleMealTypeToggle(mealType)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      selectedMealTypes.includes(mealType)
                        ? 'border-zynk-purple bg-zynk-purple/5 text-zynk-purple'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>{mealLabels[mealType]}</span>
                    {selectedMealTypes.includes(mealType) && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="mt-5 space-y-2 border-t border-slate-100 pt-5">
              <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Delivery Address</label>
              {addresses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                  No saved addresses found. Default address will be assigned upon subscription.
                </div>
              ) : (
                <>
                  <select
                    value={selectedAddress ?? ''}
                    onChange={(e) => setSelectedAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-zynk-purple"
                  >
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>{address.label} • {address.street}, {address.city}</option>
                    ))}
                  </select>
                  <p className="flex items-center gap-1 text-[11px] text-slate-500"><Info className="h-3.5 w-3.5" /> Changing the address automatically rechecks delivery service.</p>
                </>
              )}
            </div>

            {serviceability ? (
              <div className={`mt-3 rounded-xl border px-3 py-2 text-xs font-medium ${serviceability.serviceable ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                {serviceability.message}
              </div>
            ) : null}

            {/* Order & Payment Summary */}
            {plans.find((p) => p.id === selectedPlanId) && (
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Selected Plan:</span>
                  <span className="font-bold text-slate-800">{plans.find((p) => p.id === selectedPlanId)?.name}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Duration:</span>
                  <span className="font-bold text-slate-800">{plans.find((p) => p.id === selectedPlanId)?.durationDays} Days</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Payment Gateway:</span>
                  <span className="font-bold text-zynk-purple flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Razorpay Checkout
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
                  <span className="font-extrabold text-slate-800">Total Payable:</span>
                  <span className="font-extrabold text-lg text-zynk-purple">₹{plans.find((p) => p.id === selectedPlanId)?.price}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-5 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                {addresses.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleServiceabilityCheck}>Check Area</Button>
                )}
                <Button
                  variant="primary"
                  className="flex-1"
                  icon={subscribing ? undefined : <CreditCard className="h-4 w-4" />}
                  onClick={handlePayment}
                  disabled={subscribing || !selectedPlanId || !selectedMealTypes.length || !serviceability?.serviceable}
                >
                  {subscribing ? 'Processing Razorpay...' : `Subscribe • ₹${plans.find((p) => p.id === selectedPlanId)?.price || 0}`}
                </Button>
              </div>

              {/* Dev Fallback Mode simulation card for local developer testing */}
              <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/70 p-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-[11px] text-amber-800">
                    <span className="font-bold">Dev Fallback Mode:</span> If testing without live Razorpay credentials, simulate payment activation.
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-7 px-2.5 whitespace-nowrap border-amber-300 text-amber-800 hover:bg-amber-100"
                    onClick={handleSimulatePaymentDev}
                    disabled={subscribing || !selectedPlanId}
                  >
                    Simulate Payment
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-xl font-extrabold text-slate-900">Weekly Menu</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              {[
                ['Monday', 'Idly + Sambar + Chutney', 'Full Meals', 'Chapathi + Vegetable Kurma'],
                ['Tuesday', 'Ven Pongal + Vadai', 'Sambar Sadham', 'Dosa + Chutney'],
                ['Wednesday', 'Poori + Potato Masala', 'Puli Sadham', 'Egg Dosa'],
              ].map(([day, breakfast, lunch, dinner]) => (
                <div key={day} className="rounded-2xl bg-slate-50 p-3">
                  <div className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-zynk-purple">{day}</div>
                  <div className="space-y-1">
                    <div><span className="font-bold text-slate-800">Breakfast:</span> {breakfast}</div>
                    <div><span className="font-bold text-slate-800">Lunch:</span> {lunch}</div>
                    <div><span className="font-bold text-slate-800">Dinner:</span> {dinner}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KitchenDetailsPage;
