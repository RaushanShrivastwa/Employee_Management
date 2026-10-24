import React from 'react';
import { PRIORITY_COLORS } from '../../utils/constants';
import { AlertCircle, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

export default function PriorityBadge({ priority, className = '' }) {
  const colorClass = PRIORITY_COLORS[priority] || 'bg-slate-100 text-slate-700 border-slate-200';

  const icon = {
    Critical: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
    High: <ArrowUp className="w-3.5 h-3.5 text-amber-600" />,
    Medium: <ArrowRight className="w-3.5 h-3.5 text-blue-600" />,
    Low: <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
  }[priority] || null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${colorClass} ${className}`}
    >
      {icon}
      {priority}
    </span>
  );
}
