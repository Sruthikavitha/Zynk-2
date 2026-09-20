import React from 'react';

export const LoadingSpinner: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-500">
      <div className="w-10 h-10 border-4 border-zynk-purple/20 border-t-zynk-purple rounded-full animate-spin"></div>
      <span className="text-xs font-semibold text-slate-600 tracking-wide">{label}</span>
    </div>
  );
};

export default LoadingSpinner;
