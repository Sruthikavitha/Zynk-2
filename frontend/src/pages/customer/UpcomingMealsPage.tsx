import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Order, Meal, Address, CutoffStatus } from '../../types';
import CutoffBanner from '../../components/common/CutoffBanner';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { Clock, MapPin, ChefHat, RefreshCw, Slash, MapPinOff, Lock, CheckCircle2, UtensilsCrossed, Truck } from 'lucide-react';

export const UpcomingMealsPage: React.FC = () => {
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<Order[]>([]);
  const [cutoffStatus, setCutoffStatus] = useState<CutoffStatus | undefined>(undefined);
  const [availableSwapMeals, setAvailableSwapMeals] = useState<Meal[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);

  // Modal states
  const [skipTargetOrder, setSkipTargetOrder] = useState<Order | null>(null);
  const [swapTargetOrder, setSwapTargetOrder] = useState<Order | null>(null);
  const [selectedSwapMealId, setSelectedSwapMealId] = useState<string>('');
  const [addressTargetOrder, setAddressTargetOrder] = useState<Order | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUpcomingMeals();
    fetchAuxiliaryData();
  }, []);

  const fetchUpcomingMeals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customer/meals');
      if (res.data.success) {
        setMeals(res.data.meals || []);
        setCutoffStatus(res.data.cutoffStatus);
      }
    } catch (err: any) {
      showToast('error', 'Error Loading Meals', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxiliaryData = async () => {
    try {
      const addrRes = await api.get('/customer/addresses');
      if (addrRes.data.success) {
        setAddresses(addrRes.data.addresses || []);
      }
      // Fetch available meals from plans/menu endpoints
      const menuRes = await api.get('/chef/menu');
      if (menuRes.data.success) {
        setAvailableSwapMeals(menuRes.data.menu || []);
      }
    } catch (err) {
      // Ignore initial aux errors
    }
  };

  // Handle Skip Meal action
  const handleConfirmSkip = async () => {
    if (!skipTargetOrder) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/customer/meals/${skipTargetOrder.id}/skip`);
      if (res.data.success) {
        showToast('success', 'Meal Skipped', 'Your meal has been marked as SKIPPED.');
        setSkipTargetOrder(null);
        fetchUpcomingMeals();
      }
    } catch (err: any) {
      showToast('error', 'Skip Action Failed', err.message || 'Meal changes are locked after 8:00 PM.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Swap Meal action
  const handleConfirmSwap = async () => {
    if (!swapTargetOrder || !selectedSwapMealId) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/customer/meals/${swapTargetOrder.id}/swap`, {
        newMealId: selectedSwapMealId,
      });
      if (res.data.success) {
        showToast('success', 'Meal Swapped Successfully', 'Your replacement meal has been saved for this delivery.');
        setSwapTargetOrder(null);
        fetchUpcomingMeals();
      }
    } catch (err: any) {
      showToast('error', 'Swap Action Failed', err.message || 'Meal changes are locked after 8:00 PM.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Change Address action
  const handleConfirmAddressChange = async () => {
    if (!addressTargetOrder || !selectedAddressId) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/customer/meals/${addressTargetOrder.id}/address`, {
        newAddressId: selectedAddressId,
      });
      if (res.data.success) {
        showToast('success', 'Delivery Address Updated', 'Meal address changed for this specific order.');
        setAddressTargetOrder(null);
        fetchUpcomingMeals();
      }
    } catch (err: any) {
      showToast('error', 'Address Change Failed', err.message || 'Meal changes are locked after 8:00 PM.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Fetching your upcoming meals..." />;
  }

  const isLocked = cutoffStatus ? cutoffStatus.isLocked : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Upcoming Flexible Meals</h1>
        <p className="text-xs text-slate-500 mt-1">
          Customize your daily breakfast, lunch, and dinner preferences before the 8:00 PM daily cutoff.
        </p>
      </div>

      {/* 8 PM Cutoff Lock Banner */}
      <CutoffBanner cutoffStatus={cutoffStatus} />

      {/* Meals Grid */}
      {meals.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
          <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800">No Upcoming Meals Found</h3>
          <p className="text-xs text-slate-500 mt-1">Please ensure you have an active subscription.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meals.map((order) => {
            const isSkipped = order.status === 'SKIPPED';
            const deliveryTimeStr =
              order.mealType === 'BREAKFAST' ? '8:30 AM' : order.mealType === 'LUNCH' ? '12:30 PM' : '7:30 PM';
            const formattedDate = new Date(order.deliveryDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl border transition-all duration-300 shadow-card hover:shadow-card-hover overflow-hidden flex flex-col justify-between ${
                  isSkipped ? 'opacity-70 border-slate-200 bg-slate-50/50' : 'border-slate-100'
                }`}
              >
                <div>
                  {/* Image Header */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={order.meal.imageUrl}
                      alt={order.meal.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-slate-900/80 backdrop-blur-md text-white font-extrabold text-xs rounded-full uppercase tracking-wider">
                        {order.mealType}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-bold text-slate-700">{formattedDate} • {deliveryTimeStr}</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-600">
                        <ChefHat className="w-3.5 h-3.5 text-zynk-purple" /> {order.chef.kitchenName}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 line-clamp-1">{order.meal.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{order.meal.description}</p>

                    {/* Delivery Address Pill */}
                    <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-2 border border-slate-100 text-xs">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-slate-800">{order.deliveryAddress.label}: </span>
                        <span className="text-slate-600 truncate">{order.deliveryAddress.street}, {order.deliveryAddress.city}</span>
                      </div>
                    </div>
                    {order.delivery && ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.delivery.status) && (
                      <Link to={`/customer/delivery/${order.delivery.id}`} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-zynk-purple hover:bg-indigo-100">
                        <Truck className="h-3.5 w-3.5" /> Track Delivery
                      </Link>
                    )}
                  </div>
                </div>

                {/* Flexible Action Buttons */}
                <div className="p-4 bg-slate-50/60 border-t border-slate-100">
                  {isLocked ? (
                    <div className="p-2.5 bg-slate-200/80 rounded-xl text-center text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> 🔒 Changes Locked After 8:00 PM
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        disabled={isSkipped}
                        onClick={() => setSkipTargetOrder(order)}
                        className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1 ${
                          isSkipped
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        <Slash className="w-3 h-3" /> Skip
                      </button>

                      <button
                        onClick={() => {
                          setSwapTargetOrder(order);
                          setSelectedSwapMealId(order.mealId);
                        }}
                        className="py-2 px-1 text-xs font-bold rounded-xl bg-indigo-50 text-zynk-purple border border-indigo-200 hover:bg-indigo-100 transition-all flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Swap
                      </button>

                      <button
                        onClick={() => {
                          setAddressTargetOrder(order);
                          setSelectedAddressId(order.deliveryAddressId);
                        }}
                        className="py-2 px-1 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center justify-center gap-1"
                      >
                        <MapPin className="w-3 h-3" /> Address
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Skip Confirmation Modal */}
      <Modal
        isOpen={!!skipTargetOrder}
        onClose={() => setSkipTargetOrder(null)}
        title="Confirm Skip Meal"
        maxWidth="sm"
      >
        <div className="space-y-4 text-slate-700">
          <p className="text-sm leading-relaxed">
            Are you sure you want to skip <strong>{skipTargetOrder?.meal.name}</strong> for{' '}
            <strong>{skipTargetOrder?.mealType}</strong>?
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-medium">
            Skipping this meal will save your quota for future extensions.
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setSkipTargetOrder(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmSkip} loading={actionLoading}>
              Confirm Skip
            </Button>
          </div>
        </div>
      </Modal>

      {/* Swap Meal Modal */}
      <Modal
        isOpen={!!swapTargetOrder}
        onClose={() => setSwapTargetOrder(null)}
        title="Swap Meal Selection"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Select an available replacement meal for your upcoming {swapTargetOrder?.mealType} order:
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {availableSwapMeals.map((meal) => (
              <label
                key={meal.id}
                className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  selectedSwapMealId === meal.id
                    ? 'border-zynk-purple bg-purple-50/50 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="swapMeal"
                  value={meal.id}
                  checked={selectedSwapMealId === meal.id}
                  onChange={() => setSelectedSwapMealId(meal.id)}
                  className="text-zynk-purple focus:ring-zynk-purple"
                />
                <img src={meal.imageUrl} alt={meal.name} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1">
                  <h4 className="font-bold text-xs text-slate-900">{meal.name}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{meal.description}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setSwapTargetOrder(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmSwap} loading={actionLoading}>
              Confirm Swap
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Address Modal */}
      <Modal
        isOpen={!!addressTargetOrder}
        onClose={() => setAddressTargetOrder(null)}
        title="Change Delivery Location for this Meal"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Select which address you want this specific meal delivered to. (Does NOT change your default home address).
          </p>

          <div className="space-y-2">
            {addresses.map((addr) => (
              <label
                key={addr.id}
                className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  selectedAddressId === addr.id
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="mealAddress"
                  value={addr.id}
                  checked={selectedAddressId === addr.id}
                  onChange={() => setSelectedAddressId(addr.id)}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{addr.label}</h4>
                  <p className="text-[11px] text-slate-500">{addr.street}, {addr.city}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setAddressTargetOrder(null)}>
              Cancel
            </Button>
            <Button variant="success" size="sm" onClick={handleConfirmAddressChange} loading={actionLoading}>
              Update Order Address
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UpcomingMealsPage;
