import React from 'react';
import { CutoffStatus } from '../../types';
import { Clock, Lock, CheckCircle2 } from 'lucide-react';

interface CutoffBannerProps {
  cutoffStatus?: CutoffStatus;
}

export const CutoffBanner: React.FC<CutoffBannerProps> = ({ cutoffStatus }) => {
  const isLocked = cutoffStatus ? cutoffStatus.isLocked : false;
  const message = cutoffStatus ? cutoffStatus.message : 'Changes available until 8:00 PM';
  const timeRemaining = cutoffStatus ? cutoffStatus.timeRemaining : '';

  if (isLocked) {
    return (
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3 my-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-wide flex items-center gap-2">
              🔒 MEAL CHANGES LOCKED
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Changes are locked after 8:00 PM. Your confirmed meals will be prepared by the cloud kitchen.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 bg-rose-500/10 text-rose-300 rounded-lg border border-rose-500/30 shrink-0">
          Enforced by Backend API
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 text-white p-4 rounded-2xl border border-emerald-500/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3 my-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
          <Clock className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="font-bold text-sm tracking-wide text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> FLEXIBLE DAILY MEAL WINDOW OPEN
          </h4>
          <p className="text-xs text-slate-200 mt-0.5">
            Skip, Swap, or Change Address freely before the 8:00 PM daily cutoff.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-emerald-500/20 px-3.5 py-1.5 rounded-xl border border-emerald-500/40 text-emerald-300 text-xs font-bold">
        <span>🟢 {timeRemaining || 'Changes available until 8:00 PM'}</span>
      </div>
    </div>
  );
};

export default CutoffBanner;
