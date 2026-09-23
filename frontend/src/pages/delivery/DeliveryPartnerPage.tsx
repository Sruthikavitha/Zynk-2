import React, { useEffect, useRef, useState } from 'react';
import { Navigation, PackageCheck, Radio, Square, Truck } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Delivery } from '../../types';

export const DeliveryPartnerPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [watching, setWatching] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const load = async () => {
    try { const response = await api.get('/deliveries'); setDeliveries(response.data.deliveries || []); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load deliveries.'); }
    finally { setLoading(false); }
  };
  useEffect(() => () => { if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current); }, []);
  useEffect(() => { load(); }, []);

  const updateStatus = async (delivery: Delivery, status: string) => {
    try { await api.patch(`/deliveries/${delivery.id}/status`, { status }); await load(); if (status === 'OUT_FOR_DELIVERY') startLocationWatch(delivery.id); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to update delivery status.'); }
  };
  const startLocationWatch = (deliveryId: string) => {
    if (!navigator.geolocation) { setError('Live location is unavailable because this device has no geolocation support.'); return; }
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    setWatching(deliveryId);
    watchId.current = navigator.geolocation.watchPosition(async ({ coords }) => {
      try { await api.patch(`/deliveries/${deliveryId}/location`, { latitude: coords.latitude, longitude: coords.longitude }); }
      catch (err) { setError(err instanceof Error ? err.message : 'Unable to send current location.'); }
    }, () => setError('Live location is unavailable because location access was not enabled.'), { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
  };
  const stopLocationWatch = () => { if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current); watchId.current = null; setWatching(null); };

  if (loading) return <LoadingSpinner label="Loading assigned deliveries..." />;
  return <div className="space-y-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Delivery partner</p><h1 className="mt-2 text-3xl font-extrabold text-slate-900">Your delivery dashboard</h1><p className="mt-1 text-sm text-slate-500">GPS permission is requested only when you start an active delivery.</p></div>{error && <div className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}<div className="grid gap-5">{deliveries.map((delivery) => <div key={delivery.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Truck className="h-5 w-5 text-orange-500" /><h2 className="font-extrabold text-slate-900">{delivery.order.meal.name}</h2></div><p className="mt-2 text-sm text-slate-600">{delivery.order.deliveryAddress.street}, {delivery.order.deliveryAddress.city}</p><p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">{delivery.status.replace(/_/g, ' ')}</p></div><div className="flex flex-wrap gap-2">{delivery.status === 'ASSIGNED' && <Button onClick={() => updateStatus(delivery, 'PICKED_UP')} icon={<PackageCheck className="h-4 w-4" />}>Picked Up</Button>}{delivery.status === 'PICKED_UP' && <Button onClick={() => updateStatus(delivery, 'OUT_FOR_DELIVERY')} icon={<Navigation className="h-4 w-4" />}>Start Delivery</Button>}{delivery.status === 'OUT_FOR_DELIVERY' && <><Button onClick={() => startLocationWatch(delivery.id)} icon={<Radio className="h-4 w-4" />}>{watching === delivery.id ? 'GPS Active' : 'Resume GPS'}</Button><Button variant="secondary" onClick={() => updateStatus(delivery, 'DELIVERED')} icon={<PackageCheck className="h-4 w-4" />}>Delivered</Button></>}{watching === delivery.id && <Button variant="secondary" onClick={stopLocationWatch} icon={<Square className="h-4 w-4" />}>Stop GPS</Button>}</div></div></div>)}</div>{deliveries.length === 0 && <div className="rounded-3xl bg-white p-12 text-center text-sm text-slate-500">No assigned deliveries.</div>}</div>;
};

export default DeliveryPartnerPage;