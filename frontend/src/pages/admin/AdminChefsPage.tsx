import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Chef } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { ChefHat, CheckCircle, XCircle, Clock } from 'lucide-react';

export const AdminChefsPage: React.FC = () => {
  const { showToast } = useNotification();
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchChefs();
  }, []);

  const fetchChefs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/chefs');
      if (res.data.success) {
        setChefs(res.data.chefs || []);
      }
    } catch (err: any) {
      showToast('error', 'Error Loading Chefs', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveChef = async (chefId: string) => {
    setActionLoadingId(chefId);
    try {
      const res = await api.post(`/admin/chefs/${chefId}/approve`);
      if (res.data.success) {
        showToast('success', 'Chef Approved!', 'Chef account is now active and approved for cloud operations.');
        fetchChefs();
      }
    } catch (err: any) {
      showToast('error', 'Approval Failed', err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectChef = async (chefId: string) => {
    setActionLoadingId(chefId);
    try {
      const res = await api.post(`/admin/chefs/${chefId}/reject`);
      if (res.data.success) {
        showToast('warning', 'Chef Rejected', 'Chef application status updated to REJECTED.');
        fetchChefs();
      }
    } catch (err: any) {
      showToast('error', 'Rejection Failed', err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading chef applications..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Chef Registrations & Approvals</h1>
        <p className="text-xs text-slate-500 mt-1">Review kitchen partner applications and manage active chefs.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Chef / Kitchen Name</th>
                <th className="p-4">Type & Location</th>
                <th className="p-4">FSSAI License</th>
                <th className="p-4">Status</th>
                <th className="p-4">Applied Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chefs.map((chef) => (
                <tr key={chef.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-900">
                    <div>{chef.kitchenName}</div>
                    <div className="text-[11px] font-normal text-slate-500">{chef.user?.name} ({chef.user?.email})</div>
                  </td>
                  <td className="p-4 text-slate-700">
                    {chef.kitchenType} • <strong>{chef.location}</strong>
                  </td>
                  <td className="p-4 font-mono text-slate-600">{chef.fssaiNumber || 'Pending verification'}</td>
                  <td className="p-4">
                    <StatusBadge status={chef.approvalStatus} size="sm" />
                  </td>
                  <td className="p-4 text-slate-500">
                    {new Date(chef.createdAt || Date.now()).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    {chef.approvalStatus === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          loading={actionLoadingId === chef.id}
                          onClick={() => handleApproveChef(chef.id)}
                          icon={<CheckCircle className="w-3.5 h-3.5" />}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={actionLoadingId === chef.id}
                          onClick={() => handleRejectChef(chef.id)}
                          icon={<XCircle className="w-3.5 h-3.5" />}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {chef.approvalStatus === 'APPROVED' && (
                      <span className="text-xs font-bold text-emerald-600">Active Partner</span>
                    )}
                    {chef.approvalStatus === 'REJECTED' && (
                      <span className="text-xs font-bold text-rose-500">Rejected</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminChefsPage;
