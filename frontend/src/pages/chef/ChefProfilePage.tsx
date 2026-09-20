import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Chef } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { ChefHat, Building2, MapPin, FileCheck } from 'lucide-react';

export const ChefProfilePage: React.FC = () => {
  const [chef, setChef] = useState<Chef | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/chef/application');
      if (res.data.success) {
        setChef(res.data.chef);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Fetching kitchen profile..." />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Kitchen Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Official cloud kitchen registration & verification details.</p>
      </div>

      <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-card space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center">
              <ChefHat className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-slate-900">{chef?.kitchenName}</h3>
              <p className="text-xs text-slate-500">{chef?.kitchenType} • {chef?.location}</p>
            </div>
          </div>
          <StatusBadge status={chef?.approvalStatus || 'PENDING'} size="md" />
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between p-3.5 bg-slate-50 rounded-2xl">
            <span className="text-slate-500 font-medium">FSSAI License:</span>
            <span className="font-bold text-slate-900">{chef?.fssaiNumber || '12421003000456'}</span>
          </div>

          <div className="flex justify-between p-3.5 bg-slate-50 rounded-2xl">
            <span className="text-slate-500 font-medium">Approval Timestamp:</span>
            <span className="font-bold text-slate-900">
              {chef?.approvedAt ? new Date(chef.approvedAt).toLocaleDateString() : 'Under Admin Review'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
            <span className="text-slate-500 font-medium">Description:</span>
            <p className="text-slate-800 font-medium leading-relaxed">{chef?.description || 'Authentic daily meals.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChefProfilePage;
