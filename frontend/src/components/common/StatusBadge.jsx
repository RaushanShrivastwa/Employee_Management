import React from 'react';
import { STATUS_COLORS } from '../../utils/constants';

export default function StatusBadge({ status, className = '' }) {
  const colorClass = STATUS_COLORS[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  const dotColor = {
    Active: 'bg-emerald-500',
    'On Leave': 'bg-amber-500',
    Inactive: 'bg-slate-400',
    Todo: 'bg-blue-500',
    'In Progress': 'bg-indigo-500',
    Completed: 'bg-emerald-500',
    Cancelled: 'bg-rose-500'
  }[status] || 'bg-slate-400';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
}
