import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Meal, MealType } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Utensils, Plus, Trash2, Edit, CheckCircle } from 'lucide-react';

export const ChefMenuPage: React.FC = () => {
  const { showToast } = useNotification();
  const [menu, setMenu] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mealType, setMealType] = useState<MealType>('LUNCH');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('149');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await api.get('/chef/menu');
      if (res.data.success) {
        setMenu(res.data.menu || []);
      }
    } catch (err: any) {
      showToast('error', 'Failed to load menu', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      showToast('warning', 'Missing fields', 'Name and description are required.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/chef/menu', {
        name,
        description,
        mealType,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
        price: parseFloat(price),
        isAvailable: true,
      });

      if (res.data.success) {
        showToast('success', 'Meal Created', 'New item added to your kitchen menu.');
        setIsModalOpen(false);
        setName('');
        setDescription('');
        fetchMenu();
      }
    } catch (err: any) {
      showToast('error', 'Failed to add meal', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      const res = await api.delete(`/chef/menu/${id}`);
      if (res.data.success) {
        showToast('success', 'Meal Deleted', 'Item removed from menu.');
        fetchMenu();
      }
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading your menu items..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Kitchen Menu Management</h1>
          <p className="text-xs text-slate-500 mt-1">Add and manage meals available for customer subscription swaps.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold" icon={<Plus className="w-4 h-4" />}>
          Add New Meal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menu.map((meal) => (
          <div key={meal.id} className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden flex flex-col justify-between">
            <div>
              <img src={meal.imageUrl} alt={meal.name} className="w-full h-40 object-cover" />
              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-100 text-amber-900 rounded">
                    {meal.mealType}
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">₹{meal.price}</span>
                </div>
                <h3 className="font-bold text-base text-slate-900">{meal.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{meal.description}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => handleDeleteMeal(meal.id)}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Meal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Menu Item">
        <form onSubmit={handleCreateMeal} className="space-y-4">
          <Input
            label="Meal Name *"
            placeholder="e.g. Ven Pongal / Kuzhi Paniyaram / Sambar Sadham"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Meal Category / Type *
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as MealType)}
              className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="BREAKFAST">BREAKFAST</option>
              <option value="LUNCH">LUNCH</option>
              <option value="DINNER">DINNER</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Description *
            </label>
            <textarea
              rows={2}
              placeholder="Detailed description of ingredients and thali inclusions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <Input
            label="Image URL"
            placeholder="https://images.unsplash.com/..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />

          <Input
            label="Price (₹)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" className="bg-amber-500 text-slate-950 font-bold" loading={saving}>
              Add to Menu
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ChefMenuPage;
