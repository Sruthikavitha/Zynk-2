import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Star, MapPin, Check, ChefHat, UtensilsCrossed, CalendarDays, Sparkles, CreditCard } from 'lucide-react';

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

  useEffect(() => {
    if (!kitchenId) return;
    const fetchKitchen = async () => {
      try {
        const kitchenRes = await api.get(`/customer/kitchens/${kitchenId}`);
        const menuRes = await api.get(`/customer/kitchens/${kitchenId}/menu`);
        const addrRes = await api.get('/customer/addresses');

        if (kitchenRes.data.success) setKitchen(kitchenRes.data.kitchen);
        if (menuRes.data.success) setMenu(menuRes.data.meals || []);
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
    if (!serviceability?.serviceable) {
      showToast('error', 'Address not serviceable', 'This kitchen does not deliver to the selected address.');
      return;
    }

    try {
      const res = await api.post('/payments/create-order', { planId: 'demo-plan' });
      if (!res.data.success) {
        throw new Error(res.data.error || 'Payment setup failed');
      }
      showToast('success', 'Subscription activated', 'Your kitchen subscription has been activated.');
      navigate('/customer/dashboard');
    } catch (err: any) {
      showToast('error', 'Payment failed', err.message || 'Unable to process payment.');
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
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zynk-purple">
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

            <div className="space-y-5">
              {groupedMenu.map((group) => (
                <div key={group.type}>
                  <h3 className="mb-3 text-sm font-extrabold uppercase tracking-[0.12em] text-slate-500">{mealLabels[group.type] || group.type}</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.items.length ? group.items.map((item: any) => (
                      <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-800">{item.name}</span>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{item.mealType}</span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">{item.description || 'Freshly made with traditional Tamil ingredients.'}</div>
                      </div>
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
            <h2 className="text-xl font-extrabold text-slate-900">Available Subscription</h2>
            <div className="mt-4 space-y-3">
              {MENU_CATEGORIES.map((mealType) => (
                <button
                  key={mealType}
                  type="button"
                  onClick={() => handleMealTypeToggle(mealType)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
                    selectedMealTypes.includes(mealType)
                      ? 'border-zynk-purple bg-zynk-purple/5 text-zynk-purple'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{mealLabels[mealType]}</span>
                  {selectedMealTypes.includes(mealType) && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Selected Meal Slots</p>
              <p className="mt-2 text-sm font-bold text-slate-800">{selectedMealTypes.length ? selectedMealTypes.map((type) => mealLabels[type]).join(' + ') : 'None selected'}</p>
            </div>

            <div className="mt-5 space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Delivery Address</label>
              <select
                value={selectedAddress ?? ''}
                onChange={(e) => setSelectedAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-zynk-purple"
              >
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>{address.label} • {address.street}, {address.city}</option>
                ))}
              </select>
            </div>

            {serviceability ? (
              <div className={`mt-4 rounded-2xl border px-3 py-2.5 text-sm font-medium ${serviceability.serviceable ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                {serviceability.message}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" onClick={handleServiceabilityCheck}>Check Service Area</Button>
              <Button variant="primary" icon={<CreditCard className="h-4 w-4" />} onClick={handlePayment}>Subscribe</Button>
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
