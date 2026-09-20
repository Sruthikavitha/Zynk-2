import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Chef } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { Clock, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';

export const ChefApplicationStatusPage: React.FC = () => {
  const navigate = useNavigate();
  const [chef, setChef] = useState<Chef | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/chef/application');
      if (res.data.success) {
        setChef(res.data.chef);
        if (res.data.chef?.approvalStatus === 'APPROVED') {
          navigate('/chef/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const status = chef?.approvalStatus || 'PENDING';

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          {status === 'PENDING' ? (
            <Clock className="w-8 h-8 animate-pulse" />
          ) : status === 'APPROVED' ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          ) : (
            <ShieldAlert className="w-8 h-8 text-rose-600" />
          )}
        </div>

        <div className="space-y-2">
          <div className="inline-block">
            <StatusBadge status={status} size="md" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Chef Application Status
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {status === 'PENDING' && (
              <>
                Your kitchen application for <strong>{chef?.kitchenName || 'Cloud Kitchen'}</strong> has been submitted successfully.
                <br />
                <span className="font-semibold text-slate-700">Admin will review your application.</span>
              </>
            )}
            {status === 'REJECTED' && (
              <>
                Unfortunately, your application for <strong>{chef?.kitchenName}</strong> was not approved at this time.
              </>
            )}
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">Kitchen Name: {chef?.kitchenName}</p>
          <p>Location: {chef?.location}</p>
          <p>FSSAI: {chef?.fssaiNumber || 'Under verification'}</p>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={checkStatus} icon={<RefreshCw className="w-4 h-4" />}>
            Refresh Status
          </Button>
          {status === 'APPROVED' && (
            <Button variant="primary" size="sm" onClick={() => navigate('/chef/dashboard')}>
              Go to Chef Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChefApplicationStatusPage;
