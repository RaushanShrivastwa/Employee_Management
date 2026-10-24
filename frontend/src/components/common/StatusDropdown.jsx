import React, { useState } from 'react';
import { TRANSITIONS, STATUS_COLORS } from '../../utils/constants';
import { ChevronDown, Loader2 } from 'lucide-react';

export default function StatusDropdown({
  status,
  onStatusChange,
  disabled = false,
  className = ''
}) {
  const [loading, setLoading] = useState(false);

  const allowedTransitions = TRANSITIONS[status] || [];
  const isTerminal = allowedTransitions.length === 0;

  const dotColor = {
    Todo: 'bg-blue-500',
    'In Progress': 'bg-indigo-500',
    Completed: 'bg-emerald-500',
    Cancelled: 'bg-rose-500'
  }[status] || 'bg-slate-400';

  const colorClass = STATUS_COLORS[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  // If terminal (Completed or Cancelled), render read-only badge
  if (isTerminal) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass} ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span>{status}</span>
      </span>
    );
  }

  const handleChange = async (e) => {
    const nextStatus = e.target.value;
    if (!nextStatus || nextStatus === status) return;
    try {
      setLoading(true);
      await onStatusChange(nextStatus);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={status}
        disabled={disabled || loading}
        onChange={handleChange}
        className={`appearance-none inline-flex items-center gap-1.5 pl-3 pr-7 py-1 rounded-full text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs ${colorClass}`}
        title={`Current: ${status}. Click to transition status.`}
      >
        <option value={status} disabled>
          ● {status}
        </option>
        {allowedTransitions.map((nextSt) => (
          <option key={nextSt} value={nextSt} className="bg-white text-slate-800 font-medium">
            → Move to {nextSt}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-current opacity-70">
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </div>
    </div>
  );
}
