import React from 'react';
import { Loader2 } from 'lucide-react';

export default function PageLoader({ message = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[350px] p-8 text-center">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin" />
        <Loader2 className="w-5 h-5 text-brand-600 absolute animate-pulse" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
}
