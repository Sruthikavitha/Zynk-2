import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { MapPin, Search, Star, UtensilsCrossed, Sparkles, ChevronRight, MapPinned } from 'lucide-react';

interface KitchenSummary {
  id: string;
  kitchenName: string;
  district: string;
  city: string;
  area: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  cuisine?: string;
  description?: string;
  rating?: number | null;
  isActive?: boolean;
  meals: Array<{ id: string; mealType: string; name: string }>;
  serviceAreas?: string[];
}

const FILTERS = ['All', 'BREAKFAST', 'LUNCH', 'DINNER', 'VEGETARIAN', 'NON_VEGETARIAN', 'HEALTHY'];

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

  useEffect(() => {
    if (!selectedDistrict) return;

    const fetchKitchens = async () => {
      setLoading(true);
      try {
        const res = await api.get('/customer/kitchens', {
          params: { district: selectedDistrict, q: query, mealType: mealFilter === 'All' ? 'ALL' : mealFilter },
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
  }, [selectedDistrict, query, mealFilter]);

  const filteredKitchens = useMemo(() => {
    return kitchens.filter((kitchen) => {
      if (!query) return true;
      const haystack = `${kitchen.kitchenName} ${kitchen.area} ${kitchen.city} ${kitchen.address || ''}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [kitchens, query]);

  const renderMapMarker = (kitchen: KitchenSummary, index: number) => {
    const left = 18 + (((Number(kitchen.latitude ?? 11 + index) - 10.5) / 0.7) * 58);
    const top = 24 + (((Number(kitchen.longitude ?? 77 + index) - 76.2) / 0.7) * 52);

    const isActive = highlightedKitchenId === kitchen.id;

    return (
      <button
        key={kitchen.id}
        type="button"
        onClick={() => {
          setHighlightedKitchenId(kitchen.id);
          navigate(`/customer/kitchen/${kitchen.id}`);
        }}
        className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border-2 text-[10px] font-bold shadow-lg transition-all ${
          isActive ? 'bg-zynk-purple border-white text-white w-8 h-8' : 'bg-white border-zynk-purple text-zynk-purple w-6 h-6'
        }`}
        style={{ left: `${Math.min(90, Math.max(10, left))}%`, top: `${Math.min(85, Math.max(12, top))}%` }}
        title={kitchen.kitchenName}
      >
        {isActive ? '●' : '•'}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-gradient-to-r from-amber-50 via-rose-50 to-orange-50 border border-amber-100 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zynk-purple">FIND YOUR HOME KITCHEN</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Find Homemade Food Near You</h1>
            <p className="mt-2 text-sm text-slate-600">Choose your district to discover home chefs and cloud kitchens near you.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm min-w-[260px]">
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">Selected District</p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">{selectedDistrict}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Search District</label>
          <div className="relative mt-3">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Search district or area..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-zynk-purple focus:ring-2 focus:ring-zynk-purple/20"
            />
          </div>

          <div className="mt-5 space-y-2">
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
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="text-3xl font-extrabold text-slate-900">{summary.homeKitchens || kitchens.length}</div>
              <div className="mt-2 text-xs text-slate-500">Home Kitchens</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="text-3xl font-extrabold text-slate-900">{summary.breakfastMenus || 0}</div>
              <div className="mt-2 text-xs text-slate-500">Breakfast Menus</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="text-3xl font-extrabold text-slate-900">{summary.lunchMenus || 0}</div>
              <div className="mt-2 text-xs text-slate-500">Lunch Menus</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="text-3xl font-extrabold text-slate-900">{summary.dinnerMenus || 0}</div>
              <div className="mt-2 text-xs text-slate-500">Dinner Menus</div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Home Kitchens in {selectedDistrict}</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">{filteredKitchens.length} kitchens</span>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setMealFilter(filter)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] transition ${
                      mealFilter === filter ? 'bg-zynk-purple text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {filter.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
                {loading ? (
                  <LoadingSpinner label="Loading kitchen options..." />
                ) : filteredKitchens.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No home kitchens found in this district matching your search.
                  </div>
                ) : (
                  filteredKitchens.map((kitchen) => {
                    const isSelected = highlightedKitchenId === kitchen.id;
                    const mealTypes = kitchen.meals?.map((meal) => meal.mealType).filter(Boolean).slice(0, 3);
                    return (
                      <div
                        key={kitchen.id}
                        className={`rounded-2xl border p-4 transition-all ${
                          isSelected ? 'border-zynk-purple bg-zynk-purple/5 shadow-md' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-extrabold text-slate-900">{kitchen.kitchenName}</h3>
                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="h-3.5 w-3.5 text-rose-500" /> {kitchen.area || kitchen.city}, {kitchen.district || selectedDistrict}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">
                            <Star className="h-3 w-3 fill-current" /> {kitchen.rating ?? 4.8}
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-slate-600">
                          <div className="mb-2 flex items-center gap-2"><UtensilsCrossed className="h-3.5 w-3.5 text-emerald-500" /> {kitchen.cuisine || 'Tamil Nadu Homemade Food'}</div>
                          <p className="text-slate-500">{kitchen.description || 'Fresh home-style Tamil Nadu meals delivered daily.'}</p>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                          {(mealTypes?.length ? mealTypes : ['BREAKFAST', 'LUNCH', 'DINNER']).map((label) => (
                            <span key={label} className="rounded-full bg-white px-2 py-1 border border-slate-200">{label}</span>
                          ))}
                        </div>

                        <div className="mt-4 flex justify-end">
                          <Button
                            variant={isSelected ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setHighlightedKitchenId(kitchen.id);
                              navigate(`/customer/kitchen/${kitchen.id}`);
                            }}
                          >
                            View Kitchen
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Kitchen Location Map</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700">
                  <MapPinned className="h-3 w-3" /> District View
                </span>
              </div>

              <div className="relative h-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.12),_rgba(255,255,255,0.8)_55%)]">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.18)_1px,transparent_1px)] bg-[size:28px_28px] opacity-60" />
                <div className="absolute inset-4 rounded-[22px] border border-slate-200 bg-white/40" />
                {filteredKitchens.length > 0 && filteredKitchens.map((kitchen, index) => renderMapMarker(kitchen, index))}
                <div className="absolute bottom-4 left-4 rounded-xl bg-white/90 px-3 py-2 text-xs shadow-sm border border-slate-200">
                  <div className="font-bold uppercase tracking-[0.14em] text-slate-500">Selected District</div>
                  <div className="mt-1 font-extrabold text-slate-900">{selectedDistrict}</div>
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
