import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  MapPin,
  Search,
  Star,
  UtensilsCrossed,
  ChevronRight,
  MapPinned,
  LocateFixed,
  X,
  Navigation,
  Compass,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { Address } from '../../types';
import 'leaflet/dist/leaflet.css';

interface KitchenSummary {
  id: string;
  kitchenName: string;
  district: string;
  city: string;
  area: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  deliveryRadiusKm?: number;
  distanceKm?: number | null;
  distanceFormatted?: string | null;
  isWithinRadius?: boolean;
  cuisine?: string;
  description?: string;
  rating?: number | null;
  isActive?: boolean;
  meals: Array<{ id: string; mealType: string; name: string }>;
  serviceAreas?: string[];
}

const FILTERS = ['All', 'BREAKFAST', 'LUNCH', 'DINNER', 'VEGETARIAN', 'NON_VEGETARIAN', 'HEALTHY'];

const kitchenIcon = (active: boolean) =>
  L.divIcon({
    className: 'zynk-kitchen-marker',
    html: `<span class="${active ? 'active' : ''}">⌂</span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });

const customerMarkerIcon = L.divIcon({
  className: 'zynk-customer-marker',
  html: `<div style="background-color: #2563eb; width: 30px; height: 30px; border-radius: 9999px; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">📍</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const MapFocus: React.FC<{
  kitchen: KitchenSummary | undefined;
  customerCoords: { lat: number; lng: number } | null;
}> = ({ kitchen, customerCoords }) => {
  const map = useMap();
  useEffect(() => {
    if (kitchen?.latitude != null && kitchen.longitude != null) {
      map.flyTo([kitchen.latitude, kitchen.longitude], 13, { duration: 0.7 });
    } else if (customerCoords) {
      map.flyTo([customerCoords.lat, customerCoords.lng], 13, { duration: 0.7 });
    }
  }, [kitchen, customerCoords, map]);
  return null;
};

export const FindKitchenPage: React.FC = () => {
  const navigate = useNavigate();
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState('Coimbatore');
  const [query, setQuery] = useState('');
  const [mealFilter, setMealFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [kitchens, setKitchens] = useState<KitchenSummary[]>([]);
  const [summary, setSummary] = useState({ homeKitchens: 0, breakfastMenus: 0, lunchMenus: 0, dinnerMenus: 0 });
  const [highlightedKitchenId, setHighlightedKitchenId] = useState<string | null>(null);

  // Address and Real Distance Filtering state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('Detecting location...');

  // 1. Fetch available districts
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const res = await api.get('/customer/districts');
        const fetched = res.data?.districts || [];
        setDistricts(fetched.length ? fetched : ['Coimbatore', 'Chennai', 'Madurai', 'Salem']);
        if (fetched.length) {
          setSelectedDistrict(fetched[0]);
        }
      } catch (err) {
        setDistricts(['Coimbatore', 'Chennai', 'Madurai', 'Salem']);
      }
    };

    fetchDistricts();
  }, []);

  // 2. Fetch customer addresses or fallback to browser geolocation
  useEffect(() => {
    const fetchCustomerLocation = async () => {
      try {
        const res = await api.get('/customer/addresses');
        if (res.data?.success && Array.isArray(res.data.addresses) && res.data.addresses.length > 0) {
          const list: Address[] = res.data.addresses;
          setAddresses(list);
          const defaultAddr = list.find((a) => a.isDefault) || list[0];
          setSelectedAddressId(defaultAddr.id);

          if (defaultAddr.latitude != null && defaultAddr.longitude != null) {
            setCustomerCoords({
              lat: defaultAddr.latitude,
              lng: defaultAddr.longitude,
              label: `${defaultAddr.label} (${defaultAddr.street}, ${defaultAddr.city})`,
            });
            setLocationStatus(`${defaultAddr.label} (${defaultAddr.city})`);
            return;
          }
        }
      } catch (err) {
        // Unauthenticated or address fetch error - proceed to browser geolocation fallback
      }

      // Geolocation fallback
      if (navigator.geolocation) {
        setLocationStatus('Requesting browser location...');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCustomerCoords({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              label: 'Current Device Location',
            });
            setSelectedAddressId('device_gps');
            setLocationStatus('Current Device Location');
          },
          () => {
            setLocationStatus('Browse by district');
          },
          { timeout: 7000 }
        );
      } else {
        setLocationStatus('Browse by district');
      }
    };

    fetchCustomerLocation();
  }, []);

  // Handle switching customer reference location
  const handleAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);
    if (addressId === 'device_gps') {
      if (navigator.geolocation) {
        setLocationStatus('Locating device...');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCustomerCoords({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              label: 'Current Device Location',
            });
            setLocationStatus('Current Device Location');
          },
          () => {
            setLocationStatus('Location unavailable');
          }
        );
      }
    } else {
      const selected = addresses.find((a) => a.id === addressId);
      if (selected && selected.latitude != null && selected.longitude != null) {
        setCustomerCoords({
          lat: selected.latitude,
          lng: selected.longitude,
          label: `${selected.label} (${selected.street}, ${selected.city})`,
        });
        setLocationStatus(`${selected.label} (${selected.city})`);
      } else {
        setCustomerCoords(null);
        setLocationStatus('No coordinates for this address');
      }
    }
  };

  // 3. Fetch kitchens with distance filtering and coordinates
  useEffect(() => {
    const fetchKitchens = async () => {
      setLoading(true);
      try {
        const res = await api.get('/customer/kitchens', {
          params: {
            district: selectedDistrict,
            q: query,
            mealType: mealFilter === 'All' ? 'ALL' : mealFilter,
            lat: customerCoords?.lat,
            lng: customerCoords?.lng,
            addressId: selectedAddressId && selectedAddressId !== 'device_gps' ? selectedAddressId : undefined,
          },
        });

        if (res.data.success) {
          setSummary(res.data.summary || { homeKitchens: 0, breakfastMenus: 0, lunchMenus: 0, dinnerMenus: 0 });
          setKitchens(res.data.kitchens || []);
          if (res.data.kitchens?.[0]) {
            setHighlightedKitchenId(res.data.kitchens[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load kitchens', err);
      } finally {
        setLoading(false);
      }
    };

    fetchKitchens();
  }, [selectedDistrict, query, mealFilter, customerCoords, selectedAddressId]);

  const filteredKitchens = useMemo(() => {
    return kitchens.filter((kitchen) => {
      if (!query) return true;
      const haystack = `${kitchen.kitchenName} ${kitchen.area} ${kitchen.city} ${kitchen.address || ''}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [kitchens, query]);

  const selectedKitchen = filteredKitchens.find((kitchen) => kitchen.id === highlightedKitchenId) || filteredKitchens[0];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="rounded-[28px] bg-gradient-to-r from-amber-50 via-rose-50 to-orange-50 border border-amber-100 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-zynk-purple">
                DISTANCE-BASED KITCHEN DISCOVERY
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                <Compass className="h-3 w-3" /> Real Distance Active
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              Find Homemade Food Near You
            </h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Kitchens filtered and sorted by real kilometer distance within each chef's delivery radius.
            </p>
          </div>

          {/* Delivery Location Selector Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm min-w-[280px]">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-rose-500" /> Deliver To
              </span>
              {customerCoords && <span className="text-emerald-600 font-extrabold">GPS Active</span>}
            </div>

            {addresses.length > 0 ? (
              <select
                value={selectedAddressId}
                onChange={(e) => handleAddressChange(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-zynk-purple focus:ring-1 focus:ring-zynk-purple"
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} • {a.street}, {a.city}
                  </option>
                ))}
                <option value="device_gps">📍 Use Current Device GPS</option>
              </select>
            ) : (
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 truncate max-w-[200px]">
                  {locationStatus}
                </span>
                <button
                  type="button"
                  onClick={() => handleAddressChange('device_gps')}
                  className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-100 flex items-center gap-1"
                >
                  <LocateFixed className="h-3 w-3" /> Locate
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_1fr]">
        {/* Left Column: District and Search Filters */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold">
            Search District or Kitchen
          </label>
          <div className="relative mt-3">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Search district, area or chef..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-zynk-purple focus:ring-2 focus:ring-zynk-purple/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-2.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-5 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2">
              Filter by District
            </div>
            {districts.map((district) => (
              <button
                type="button"
                key={district}
                onClick={() => setSelectedDistrict(district)}
                className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                  selectedDistrict === district
                    ? 'border-zynk-purple bg-zynk-purple/5 text-zynk-purple'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>{district}</span>
                {selectedDistrict === district && <ChevronRight className="h-4 w-4" />}
              </button>
            ))}
          </div>

          {/* Quick Distance info pill */}
          {customerCoords && (
            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-[11px] text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1 text-blue-800">
                <Navigation className="h-3.5 w-3.5 fill-blue-700" /> Radius Distance Active
              </div>
              <p className="text-slate-600 leading-snug">
                Showing nearest kitchens first. Kitchens outside their delivery radius are filtered automatically.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Summaries, Kitchen Cards, and Map */}
        <div className="space-y-5">
          {/* Quick stats grid */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="text-3xl font-extrabold text-slate-900">{summary.homeKitchens || kitchens.length}</div>
              <div className="mt-2 text-xs text-slate-500 font-medium">Serviceable Kitchens</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="text-3xl font-extrabold text-slate-900">{summary.breakfastMenus || 0}</div>
              <div className="mt-2 text-xs text-slate-500 font-medium">Breakfast Menus</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="text-3xl font-extrabold text-slate-900">{summary.lunchMenus || 0}</div>
              <div className="mt-2 text-xs text-slate-500 font-medium">Lunch Menus</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="text-3xl font-extrabold text-slate-900">{summary.dinnerMenus || 0}</div>
              <div className="mt-2 text-xs text-slate-500 font-medium">Dinner Menus</div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
            {/* Kitchen cards list */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                    Kitchens in {selectedDistrict}
                  </h2>
                  <p className="text-xs text-slate-500">Sorted nearest to you first</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  {filteredKitchens.length} available
                </span>
              </div>

              {/* Meal Filter Chips */}
              <div className="mb-4 flex flex-wrap gap-2">
                {FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setMealFilter(filter)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] transition ${
                      mealFilter === filter
                        ? 'bg-zynk-purple text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {filter.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
                {loading ? (
                  <LoadingSpinner label="Finding nearest kitchens..." />
                ) : filteredKitchens.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                    <p className="font-semibold text-slate-700">No kitchens found within delivery radius.</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Try selecting another district or expanding your search query.
                    </p>
                  </div>
                ) : (
                  filteredKitchens.map((kitchen) => {
                    const isSelected = highlightedKitchenId === kitchen.id;
                    const mealTypes = kitchen.meals?.map((meal) => meal.mealType).filter(Boolean).slice(0, 3);
                    return (
                      <div
                        key={kitchen.id}
                        className={`rounded-2xl border p-4 transition-all ${
                          isSelected
                            ? 'border-zynk-purple bg-zynk-purple/5 shadow-md ring-1 ring-zynk-purple/30'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-extrabold text-slate-900">{kitchen.kitchenName}</h3>
                              {kitchen.distanceFormatted && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700 shadow-xs">
                                  <Navigation className="h-2.5 w-2.5 fill-emerald-600 text-emerald-600" />
                                  {kitchen.distanceFormatted}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="h-3.5 w-3.5 text-rose-500" /> {kitchen.area || kitchen.city},{' '}
                              {kitchen.district || selectedDistrict}
                              {kitchen.deliveryRadiusKm != null && (
                                <span className="text-slate-400 font-medium">
                                  • Delivery radius: {kitchen.deliveryRadiusKm} km
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">
                            <Star className="h-3 w-3 fill-current" /> {kitchen.rating ?? 4.8}
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-slate-600">
                          <div className="mb-2 flex items-center gap-2">
                            <UtensilsCrossed className="h-3.5 w-3.5 text-emerald-500" />{' '}
                            {kitchen.cuisine || 'Tamil Nadu Homemade Food'}
                          </div>
                          <p className="text-slate-500">
                            {kitchen.description || 'Fresh home-style Tamil Nadu meals delivered daily.'}
                          </p>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                          {(mealTypes?.length ? mealTypes : ['BREAKFAST', 'LUNCH', 'DINNER']).map((label) => (
                            <span key={label} className="rounded-full bg-white px-2 py-1 border border-slate-200">
                              {label}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-200/60 pt-3">
                          <button
                            type="button"
                            onClick={() => setHighlightedKitchenId(kitchen.id)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-zynk-purple transition"
                          >
                            <LocateFixed className="h-3.5 w-3.5" /> Show on map
                          </button>
                          <Button
                            variant={isSelected ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setHighlightedKitchenId(kitchen.id);
                              navigate(`/customer/kitchen/${kitchen.id}`);
                            }}
                          >
                            View Kitchen & Menu
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Interactive Location Map */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Kitchen & Location Map</h2>
                  <p className="text-xs text-slate-500">Map view with delivery radius coverage</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700">
                  <MapPinned className="h-3 w-3" /> Live Coordinates
                </span>
              </div>

              <div className="relative h-[620px] overflow-hidden rounded-2xl border border-slate-200">
                {filteredKitchens.some((kitchen) => kitchen.latitude != null && kitchen.longitude != null) ||
                customerCoords ? (
                  <MapContainer
                    center={[
                      Number(selectedKitchen?.latitude || customerCoords?.lat || 11.0183),
                      Number(selectedKitchen?.longitude || customerCoords?.lng || 76.9678),
                    ]}
                    zoom={12}
                    scrollWheelZoom
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapFocus kitchen={selectedKitchen} customerCoords={customerCoords} />

                    {/* Customer Location Pin */}
                    {customerCoords && (
                      <Marker position={[customerCoords.lat, customerCoords.lng]} icon={customerMarkerIcon}>
                        <Popup>
                          <div className="p-1 space-y-1">
                            <span className="font-extrabold text-blue-700 text-xs block">📍 Your Delivery Location</span>
                            <p className="text-[11px] text-slate-600">{customerCoords.label}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Kitchen Location Pins */}
                    {filteredKitchens.map(
                      (kitchen) =>
                        kitchen.latitude != null &&
                        kitchen.longitude != null && (
                          <Marker
                            key={kitchen.id}
                            position={[kitchen.latitude, kitchen.longitude]}
                            icon={kitchenIcon(kitchen.id === highlightedKitchenId)}
                            eventHandlers={{ click: () => setHighlightedKitchenId(kitchen.id) }}
                          >
                            <Popup>
                              <div className="space-y-1.5 p-1">
                                <strong className="text-sm font-bold text-slate-900 block">{kitchen.kitchenName}</strong>
                                <div className="text-xs text-slate-500">{kitchen.area || kitchen.city}</div>
                                {kitchen.distanceFormatted && (
                                  <div className="text-xs font-bold text-emerald-700">
                                    📏 {kitchen.distanceFormatted}
                                  </div>
                                )}
                                {kitchen.deliveryRadiusKm != null && (
                                  <div className="text-[10px] text-slate-400">
                                    Radius: {kitchen.deliveryRadiusKm} km
                                  </div>
                                )}
                                <button
                                  type="button"
                                  className="mt-1 block text-xs font-bold text-zynk-purple hover:underline"
                                  onClick={() => navigate(`/customer/kitchen/${kitchen.id}`)}
                                >
                                  View menu & subscribe →
                                </button>
                              </div>
                            </Popup>
                          </Marker>
                        )
                    )}
                  </MapContainer>
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-50 text-sm text-slate-500">
                    Map location is not available for these kitchens yet.
                  </div>
                )}

                <div className="pointer-events-none absolute bottom-4 left-4 z-[500] rounded-xl bg-white/95 px-3 py-2 text-xs shadow-md border border-slate-200">
                  <div className="font-bold uppercase tracking-[0.14em] text-slate-500">Selected Area</div>
                  <div className="mt-0.5 font-extrabold text-slate-900">{selectedDistrict}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindKitchenPage;
