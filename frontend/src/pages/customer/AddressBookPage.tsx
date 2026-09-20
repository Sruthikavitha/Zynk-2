import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Address } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { MapPin, Plus, CheckCircle, Edit } from 'lucide-react';

export const AddressBookPage: React.FC = () => {
  const { showToast } = useNotification();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [label, setLabel] = useState('Home');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Coimbatore');
  const [state, setState] = useState('Tamil Nadu');
  const [postalCode, setPostalCode] = useState('641035');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customer/addresses');
      if (res.data.success) {
        setAddresses(res.data.addresses || []);
      }
    } catch (err: any) {
      showToast('error', 'Failed to load addresses', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street || !city || !postalCode) {
      showToast('warning', 'Missing fields', 'Please enter street, city, and postal code.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/customer/addresses', {
        label,
        street,
        city,
        state,
        postalCode,
        isDefault,
      });

      if (res.data.success) {
        showToast('success', 'Address Saved', 'New delivery address added to your address book.');
        setIsModalOpen(false);
        setStreet('');
        fetchAddresses();
      }
    } catch (err: any) {
      showToast('error', 'Failed to save address', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Fetching your address book..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Address Book</h1>
          <p className="text-xs text-slate-500 mt-1">Manage delivery locations for your meal subscriptions.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Add New Address
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`p-6 rounded-3xl border bg-white transition-all shadow-card hover:shadow-card-hover flex flex-col justify-between space-y-4 ${
              addr.isDefault ? 'border-zynk-purple ring-2 ring-zynk-purple/10' : 'border-slate-100'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500" /> {addr.label}
                </span>
                {addr.isDefault && (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-purple-100 text-zynk-purple rounded-full">
                    Default
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{addr.street}</p>
              <p className="text-xs text-slate-500 font-medium">
                {addr.city}, {addr.state} - {addr.postalCode}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Address Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Delivery Address">
        <form onSubmit={handleSaveAddress} className="space-y-4">
          <div className="flex items-center gap-2">
            {['Home', 'College', 'Work', 'Other'].map((lbl) => (
              <button
                key={lbl}
                type="button"
                onClick={() => setLabel(lbl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  label === lbl
                    ? 'bg-zynk-purple text-white border-zynk-purple'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          <Input
            label="Street Address / Room / Hostel *"
            placeholder="e.g. 12, Edayarpalayam or Hostel Block B"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City *"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            <Input
              label="Postal Code *"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded text-zynk-purple focus:ring-zynk-purple"
            />
            Set as Default Delivery Address
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" loading={saving}>
              Save Address
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AddressBookPage;
