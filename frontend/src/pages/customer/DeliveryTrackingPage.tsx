import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, Phone, Radio, Truck } from 'lucide-react';
import api from '../../services/api';
import { Delivery } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import 'leaflet/dist/leaflet.css';

const markerIcon = (emoji: string, color: string) => L.divIcon({
  className: 'zynk-map-marker',
  html: `<span style="background:${color}">${emoji}</span>`,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

const kitchenIcon = markerIcon('🏠', '#4f46e5');
const partnerIcon = markerIcon('🚚', '#f97316');
const customerIcon = markerIcon('📍', '#e11d48');

const MapViewport: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
  }, [map, points]);
  return null;
};

const formatDistance = (meters: number | null | undefined) => meters == null ? 'Distance unavailable' : `${(meters / 1000).toFixed(1)} km away`;

export const DeliveryTrackingPage: React.FC = () => {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketError, setSocketError] = useState('');

  const refresh = async () => {
    if (!deliveryId) return;
    try {
      const response = await api.get(`/deliveries/${deliveryId}`);
      setDelivery(response.data.delivery);
    } catch (error) {
      setSocketError(error instanceof Error ? error.message : 'Unable to load delivery tracking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [deliveryId]);

  useEffect(() => {
    const token = localStorage.getItem('zynk_token');
    if (!token || !deliveryId) return;
    const socket = io(window.location.origin, { path: '/socket.io', auth: { token } });
    socket.on('connect', () => {
      socket.emit('join-delivery', deliveryId, (result: { success: boolean; error?: string }) => {
        if (!result.success) setSocketError(result.error || 'Unable to join live tracking.');
      });
    });
    socket.on('delivery-location', (location: { latitude: number; longitude: number; lastLocationUpdate: string }) => {
      setDelivery((current) => current ? {
        ...current,
        currentLatitude: location.latitude,
        currentLongitude: location.longitude,
        lastLocationUpdate: location.lastLocationUpdate,
        route: current.route,
      } : current);
      refresh();
    });
    socket.on('connect_error', () => setSocketError('Live connection unavailable. Showing the last received location.'));
    return () => { socket.disconnect(); };
  }, [deliveryId]);

  const points = useMemo(() => {
    if (!delivery) return [];
    return [
      [delivery.pickupLatitude, delivery.pickupLongitude],
      [delivery.currentLatitude, delivery.currentLongitude],
      [delivery.deliveryLatitude, delivery.deliveryLongitude],
    ].filter((point): point is [number, number] => point[0] != null && point[1] != null)
      .map(([latitude, longitude]) => [latitude, longitude] as [number, number]);
  }, [delivery]);

  if (loading) return <LoadingSpinner label="Loading live delivery tracking..." />;
  if (!delivery) return <div className="rounded-3xl bg-white p-10 text-center text-slate-600">{socketError || 'Delivery not found.'}</div>;

  const isLive = delivery.status === 'OUT_FOR_DELIVERY';
  const lastUpdate = delivery.lastLocationUpdate ? new Date(delivery.lastLocationUpdate) : null;
  const secondsAgo = lastUpdate ? Math.max(0, Math.floor((Date.now() - lastUpdate.getTime()) / 1000)) : null;
  const locationStatus = !isLive ? 'Live tracking starts when your meal is out for delivery.' : secondsAgo == null ? 'Location unavailable' : secondsAgo > 120 ? `Location unavailable. Last location received ${Math.floor(secondsAgo / 60)} minutes ago.` : `Live tracking updated ${secondsAgo} seconds ago`;
  const defaultCenter: [number, number] = points[0] || [11.0168, 76.9558];
  const route = delivery.route?.coordinates || points;

  return (
    <div className="space-y-6">
      <Link to="/customer/meals" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-zynk-purple"><ArrowLeft className="h-4 w-4" /> Upcoming meals</Link>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zynk-purple">Track your ZYNK delivery</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{delivery.order.meal.name}</h1>
        <p className="mt-1 text-sm text-slate-500">{delivery.order.mealType} from {delivery.order.chef.kitchenName}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
          {points.length > 1 ? (
            <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom className="h-[520px] w-full">
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapViewport points={points} />
              {delivery.pickupLatitude != null && delivery.pickupLongitude != null && <Marker position={[delivery.pickupLatitude, delivery.pickupLongitude]} icon={kitchenIcon}><Popup>Home Kitchen</Popup></Marker>}
              {delivery.currentLatitude != null && delivery.currentLongitude != null && <Marker position={[delivery.currentLatitude, delivery.currentLongitude]} icon={partnerIcon}><Popup>Delivery Partner current location</Popup></Marker>}
              {delivery.deliveryLatitude != null && delivery.deliveryLongitude != null && <Marker position={[delivery.deliveryLatitude, delivery.deliveryLongitude]} icon={customerIcon}><Popup>Your delivery address</Popup></Marker>}
              {route.length > 1 && <Polyline positions={route} pathOptions={{ color: '#4f46e5', weight: 5, opacity: 0.8 }} />}
            </MapContainer>
          ) : <div className="flex h-[520px] items-center justify-center bg-slate-100 p-8 text-center text-sm text-slate-500">Map coordinates are not available for this delivery yet.</div>}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
            <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-widest text-slate-300">Delivery status</span><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-300"><Radio className="h-3.5 w-3.5" /> {isLive ? 'LIVE' : delivery.status.replace(/_/g, ' ')}</span></div>
            <h2 className="mt-5 text-2xl font-extrabold">{isLive ? 'Out for delivery' : delivery.status.replace(/_/g, ' ')}</h2>
            <p className="mt-2 text-sm text-slate-300">{locationStatus}</p>
            {socketError && <p className="mt-3 text-xs text-amber-300">{socketError}</p>}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card space-y-5">
            <div className="flex items-center gap-3"><Truck className="h-5 w-5 text-orange-500" /><div><p className="text-xs text-slate-500">Delivery Partner</p><p className="font-bold text-slate-900">{delivery.deliveryPartner?.user?.name || 'Not assigned'}</p></div></div>
            <div className="flex items-center gap-3"><Clock3 className="h-5 w-5 text-zynk-purple" /><div><p className="text-xs text-slate-500">Distance Remaining</p><p className="font-bold text-slate-900">{formatDistance(delivery.route?.distanceMeters)}</p></div></div>
            <div><p className="text-xs text-slate-500">Estimated Arrival</p><p className="mt-1 font-bold text-slate-900">{delivery.route?.durationSeconds != null ? `${Math.ceil(delivery.route.durationSeconds / 60)} minutes` : 'ETA unavailable'}</p></div>
            <div className="border-t border-slate-100 pt-4"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Delivering to</p><p className="mt-2 font-bold text-slate-900">{delivery.order.deliveryAddress.label}</p><p className="text-sm text-slate-600">{delivery.order.deliveryAddress.street}, {delivery.order.deliveryAddress.city}</p><p className="text-sm text-slate-600">{delivery.order.deliveryAddress.state}</p></div>
            {delivery.deliveryPartner?.user?.phone && <a href={`tel:${delivery.deliveryPartner.user.phone}`}><Button variant="secondary" className="w-full" icon={<Phone className="h-4 w-4" />}>Call Delivery Partner</Button></a>}
            {delivery.status === 'DELIVERED' && <p className="flex items-center gap-2 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-5 w-5" /> Delivered</p>}
            {!isLive && delivery.status !== 'DELIVERED' && <p className="flex items-start gap-2 text-xs text-slate-500"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Live location will appear after the delivery partner starts the journey.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DeliveryTrackingPage;