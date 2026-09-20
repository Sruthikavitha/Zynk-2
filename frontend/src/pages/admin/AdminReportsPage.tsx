import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { DailyReport } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { FileText, Play, Calendar, MapPin, Slash, RefreshCw, MapPinOff } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const { showToast } = useNotification();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/reports');
      if (res.data.success) {
        setReports(res.data.reports || []);
      }
    } catch (err: any) {
      showToast('error', 'Failed to load daily reports', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualTrigger = async () => {
    setTriggering(true);
    try {
      const res = await api.post('/admin/reports/trigger-daily');
      if (res.data.success) {
        showToast('success', '8 PM Report Triggered', 'Automated daily meal aggregation completed successfully.');
        fetchReports();
      }
    } catch (err: any) {
      showToast('error', 'Trigger Error', err.message);
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading consolidated daily reports..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Consolidated 8 PM Daily Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            System-wide automated daily report logs collecting skipped, swapped, and address change actions.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          loading={triggering}
          onClick={handleManualTrigger}
          icon={<Play className="w-4 h-4 fill-current" />}
        >
          Run 8 PM Report Job Now
        </Button>
      </div>

      <div className="space-y-6">
        {reports.map((report) => (
          <div key={report.id} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Report Date: {new Date(report.reportDate).toLocaleDateString()}
              </div>
              <span className="text-xs font-mono text-slate-400">ID: {report.id.slice(0, 8)}...</span>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500">Total Confirmed Meals</p>
                <h4 className="text-2xl font-extrabold text-slate-900">{report.totalMeals}</h4>
              </div>
              <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100">
                <p className="text-[11px] font-semibold text-rose-700 flex items-center justify-center gap-1">
                  <Slash className="w-3 h-3" /> Skipped Meals
                </p>
                <h4 className="text-2xl font-extrabold text-rose-900">{report.totalSkipped}</h4>
              </div>
              <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                <p className="text-[11px] font-semibold text-indigo-700 flex items-center justify-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Swapped Meals
                </p>
                <h4 className="text-2xl font-extrabold text-indigo-900">{report.totalSwapped}</h4>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <p className="text-[11px] font-semibold text-emerald-700 flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3" /> Address Changes
                </p>
                <h4 className="text-2xl font-extrabold text-emerald-900">{report.totalAddressChanges}</h4>
              </div>
            </div>

            {/* Chef Tally Breakdown */}
            {report.chefReports && report.chefReports.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-700 mb-2">Chef Kitchen Breakdowns:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {report.chefReports.map((cReport) => (
                    <div key={cReport.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{cReport.chef?.kitchenName || 'Kitchen Partner'}</span>
                        <span className="text-indigo-600">{cReport.totalMeals} meals</span>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        Breakfast: {cReport.breakfastCount} • Lunch: {cReport.lunchCount} • Dinner: {cReport.dinnerCount}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminReportsPage;
