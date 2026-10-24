import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import PriorityBadge from '../../components/common/PriorityBadge';
import StatusBadge from '../../components/common/StatusBadge';
import StatusDropdown from '../../components/common/StatusDropdown';

export default function TaskCard({ task, onDelete, onStatusChange, showDelete = true }) {
  const assigneeName = task.employeeSnapshot?.fullName || 'Unassigned';
  const assigneeId = task.employeeSnapshot?.employeeId || '';
  const initials = assigneeName.split(' ').map((n) => n[0]).join('').slice(0, 2);

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden">
      <div>
        {/* Top Row: Task ID, Priority & Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
            <span className="font-mono text-xs font-bold text-brand-600 truncate">
              {task.taskId}
            </span>
            <PriorityBadge priority={task.priority} />
          </div>
          {onStatusChange ? (
            <StatusDropdown
              status={task.status}
              onStatusChange={(newStatus) => onStatusChange(task._id, newStatus)}
            />
          ) : (
            <StatusBadge status={task.status} />
          )}
        </div>

        {/* Title & Description */}
        <div className="mt-3.5">
          <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-brand-600 transition line-clamp-1">
            {task.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {task.description || 'No description provided.'}
          </p>
        </div>

        {/* Middle Info Box */}
        <div className="mt-4 bg-[#f8f9fd] rounded-2xl p-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-2 text-left">
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Department</p>
              <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">{task.department}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Due Date</p>
              <p className={`text-xs font-semibold truncate mt-0.5 ${task.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                {formatDate(task.dueDate)}
                {task.isOverdue && ' (Overdue)'}
              </p>
            </div>
          </div>

          {/* Assigned Staff Pill */}
          <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-400 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 shadow-xs">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                {assigneeName}
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate">
                {assigneeId || 'Staff Member'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons: Edit and View side-by-side */}
      <div className="mt-4 pt-1 flex items-center gap-2">
        <Link
          to={`/tasks/${task._id}/edit`}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium text-center transition"
        >
          Edit
        </Link>
        <Link
          to={`/tasks/${task._id}`}
          className="flex-1 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium text-center transition shadow-xs"
        >
          View
        </Link>
        {showDelete && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(task)}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
