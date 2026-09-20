import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ChefDailyReport } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FileBarChart2, Calendar, MapPin, CheckCircle2 } from 'lucide-react';

export const ChefReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ChefDailyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/chef/reports');
      if (res.data.success) {
        setReports(res.data.reports || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading 8 PM daily reports..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Daily 8 PM Reports</h1>
        <p className="text-xs text-slate-500 mt-1">
          Automated meal preparation tallies generated every day at 8:00 PM cutoff.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <FileBarChart2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800">No Daily Reports Generated Yet</h3>
          <p className="text-xs text-slate-500">
            Daily reports are automatically collected at 8:00 PM after customer skip/swap modifications lock.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map((report) => {
            let locations: Record<string, number> = {};
            try {
              locations = JSON.parse(report.deliveryGrouping);
            } catch {
              locations = {};
            }

            return (
              <div key={report.id} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    Report Date: {new Date(report.createdAt).toLocaleDateString()}
                  </div>
                  <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    Total Prep Count: {report.totalMeals} meals
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-700">Breakfast</p>
                    <h4 className="text-xl font-extrabold text-indigo-900">{report.breakfastCount}</h4>
                  </div>
                  <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
                    <p className="text-xs font-semibold text-amber-700">Lunch</p>
                    <h4 className="text-xl font-extrabold text-amber-900">{report.lunchCount}</h4>
                  </div>
                  <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100">
                    <p className="text-xs font-semibold text-purple-700">Dinner</p>
                    <h4 className="text-xl font-extrabold text-purple-900">{report.dinnerCount}</h4>
                  </div>
                </div>

                {/* Delivery Location Breakdown */}
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> Location Grouping Tally:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(locations).map(([loc, cnt]) => (
                      <span key={loc} className="px-3 py-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700">
                        {loc}: <strong className="text-slate-900">{cnt}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChefReportsPage;
