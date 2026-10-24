import React from 'react';
import { Inbox, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'Try adjusting your filters or search terms, or add a new record to get started.',
  actionLabel,
  actionTo,
  onAction
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
      <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 mb-4 shadow-xs">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-sm">{description}</p>

      {(actionLabel && (actionTo || onAction)) && (
        <div className="mt-6">
          {actionTo ? (
            <Link
              to={actionTo}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-brand-600 rounded-2xl hover:bg-brand-700 transition shadow-sm shadow-brand-600/20"
            >
              <Plus className="w-4 h-4" />
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-brand-600 rounded-2xl hover:bg-brand-700 transition shadow-sm shadow-brand-600/20"
            >
              <Plus className="w-4 h-4" />
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
