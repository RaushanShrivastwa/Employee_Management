import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Trash2 } from 'lucide-react';

export default function EmployeeCard({ emp, onDelete, showDelete = true }) {
  const initials = emp.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'EM';

  // Status styling
  let statusClass = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
  if (emp.status === 'On Leave') {
    statusClass = 'bg-amber-50 text-amber-600 border border-amber-100';
  } else if (emp.status === 'Inactive') {
    statusClass = 'bg-slate-100 text-slate-600 border border-slate-200';
  }

  const formatJoiningDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    try {
      return new Date(dateVal).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden">
      <div>
        {/* Top Row: Avatar, Name, Role & Status Pill - Strict flex constraints prevent overflow */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs">
                {initials}
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500 absolute -top-0.5 -right-0.5 ring-2 ring-white" />
            </div>
            <div className="min-w-0 flex-1 pr-1">
              <h3 className="font-bold text-slate-900 text-sm truncate leading-tight group-hover:text-brand-600 transition">
                {emp.fullName}
              </h3>
              <p className="text-xs text-slate-400 truncate mt-0.5" title={emp.role}>
                {emp.role || 'Member'}
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap self-start ${statusClass}`}
          >
            {emp.status}
          </span>
        </div>

        {/* Middle Info Box */}
        <div className="mt-4 bg-[#f8f9fd] rounded-2xl p-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-2 text-left">
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Department</p>
              <p className="text-xs font-semibold text-slate-700 truncate mt-0.5" title={emp.department}>
                {emp.department}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Date of Joining</p>
              <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">
                {formatJoiningDate(emp.joiningDate)}
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-1 pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
            <div className="flex items-center gap-2 truncate" title={emp.email}>
              <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{emp.email}</span>
            </div>
            <div className="flex items-center gap-2 truncate" title={emp.phone}>
              <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{emp.phone || '(555) 321-7612'}</span>
            </div>
          </div>

          {/* Capacity Bar */}
          <div className="pt-1 border-t border-slate-200/60">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-slate-400 font-medium">Active Tasks:</span>
              <span className={`font-bold ${emp.activeTaskCount >= 3 ? 'text-rose-600' : 'text-slate-700'}`}>
                {emp.activeTaskCount || 0} / 3
              </span>
            </div>
            <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  emp.activeTaskCount >= 3
                    ? 'bg-rose-500'
                    : emp.activeTaskCount === 2
                    ? 'bg-amber-500'
                    : 'bg-brand-600'
                }`}
                style={{ width: `${Math.min(100, ((emp.activeTaskCount || 0) / 3) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons: Edit and View side-by-side */}
      <div className="mt-4 pt-1 flex items-center gap-2">
        <Link
          to={`/employees/${emp._id}/edit`}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium text-center transition"
        >
          Edit
        </Link>
        <Link
          to={`/employees/${emp._id}`}
          className="flex-1 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium text-center transition shadow-xs"
        >
          View
        </Link>
        {showDelete && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(emp)}
            className={`p-2 rounded-xl transition ${
              emp.hasAssignedTasks || (emp.activeTaskCount > 0)
                ? 'text-slate-300 hover:text-amber-600 hover:bg-amber-50'
                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
            }`}
            title={
              emp.hasAssignedTasks || (emp.activeTaskCount > 0)
                ? `Protected: ${emp.fullName} has assigned tasks`
                : 'Delete employee'
            }
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
