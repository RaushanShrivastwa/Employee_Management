import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { taskApi } from '../../api/taskApi';
import { formatDate } from '../../utils/formatDate';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import PageLoader from '../../components/common/PageLoader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  ArrowLeft,
  Calendar,
  AlertTriangle,
  User,
  CheckCircle2,
  Clock,
  Briefcase,
  Edit2,
  Trash2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const res = await taskApi.getTaskById(id);
      setTask(res.data);
    } catch (err) {
      toast.error(err.userMessage || 'Task not found');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusTransition = async (newStatus) => {
    try {
      setTransitioning(true);
      await taskApi.updateTaskStatus(id, newStatus);
      toast.success(`Task status transitioned to ${newStatus}`);
      loadTask();
    } catch (err) {
      toast.error(err.userMessage || 'Status transition rejected');
    } finally {
      setTransitioning(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await taskApi.deleteTask(id);
      toast.success('Task deleted successfully');
      navigate('/tasks');
    } catch (err) {
      toast.error(err.userMessage || 'Failed to delete task');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) return <PageLoader message="Loading task details..." />;
  if (!task) return null;

  const allowedNext = task.allowedNextStatuses || [];
  const isTerminal = allowedNext.length === 0;

  const isDeletedAssignee = !task.assignedEmployee && task.employeeSnapshot?.fullName;
  const assigneeName = task.assignedEmployee?.fullName || task.employeeSnapshot?.fullName || 'Unassigned';
  const assigneeId = task.assignedEmployee?.employeeId || task.employeeSnapshot?.employeeId || '';
  const assigneeEmail = task.assignedEmployee?.email || task.employeeSnapshot?.email || '';

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/tasks"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded">
                {task.taskId}
              </span>
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{task.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isTerminal && (
            <Link
              to={`/tasks/${id}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Link>
          )}
          <button
            onClick={() => setDeleteDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Overdue Warning Alert Banner */}
      {task.isOverdue && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3 text-rose-900">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Overdue Deliverable</p>
            <p className="text-xs text-rose-700 mt-0.5">
              This task was due on <span className="font-semibold">{formatDate(task.dueDate)}</span> and is still active. Please prioritize completion or adjust the deadline.
            </p>
          </div>
        </div>
      )}

      {/* Status Lifecycle & State Machine Progress Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          State Machine Progression
        </h2>

        {/* Visual Workflow Steps */}
        <div className="flex items-center justify-between relative py-2">
          {/* Step 1: Todo */}
          <div className="flex flex-col items-center z-10">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition ${
                task.status === 'Todo'
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              ✓
            </div>
            <span className="text-xs font-semibold text-slate-800 mt-2">Todo</span>
          </div>

          <div
            className={`flex-1 h-1 -mt-6 mx-2 ${
              task.status !== 'Todo' ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          />

          {/* Step 2: In Progress */}
          <div className="flex flex-col items-center z-10">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition ${
                task.status === 'In Progress'
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 animate-pulse'
                  : task.status === 'Completed'
                  ? 'bg-emerald-600 text-white'
                  : task.status === 'Cancelled'
                  ? 'bg-slate-300 text-slate-600'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {task.status === 'Completed' ? '✓' : '2'}
            </div>
            <span className="text-xs font-semibold text-slate-800 mt-2">In Progress</span>
          </div>

          <div
            className={`flex-1 h-1 -mt-6 mx-2 ${
              task.status === 'Completed' ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          />

          {/* Step 3: Terminal */}
          <div className="flex flex-col items-center z-10">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition ${
                task.status === 'Completed'
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                  : task.status === 'Cancelled'
                  ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {task.status === 'Completed' ? '✓' : task.status === 'Cancelled' ? '✕' : '3'}
            </div>
            <span className="text-xs font-semibold text-slate-800 mt-2">
              {task.status === 'Cancelled' ? 'Cancelled' : 'Completed'}
            </span>
          </div>
        </div>

        {/* State Machine Transition Actions */}
        {!isTerminal ? (
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Allowed Next Transitions:
            </span>
            <div className="flex items-center gap-2">
              {allowedNext.map((st) => (
                <button
                  key={st}
                  disabled={transitioning}
                  onClick={() => handleStatusTransition(st)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 ${
                    st === 'Completed'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : st === 'In Progress'
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Transition to {st}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>This task has reached a terminal state ({task.status}). Further status edits are locked.</span>
          </div>
        )}
      </div>

      {/* Grid: Details & Assignee Audit Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Description & Timeline Details (2 columns) */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Description & Specifications
            </h2>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {task.description || 'No description provided for this deliverable.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-sm">
            <div>
              <p className="text-xs text-slate-400">Department</p>
              <p className="font-medium text-slate-800 mt-0.5">{task.department}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Priority Level</p>
              <div className="mt-0.5">
                <PriorityBadge priority={task.priority} />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400">Start Date</p>
              <p className="font-medium text-slate-800 mt-0.5">{formatDate(task.startDate)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Due Date</p>
              <p className="font-medium text-slate-800 mt-0.5">{formatDate(task.dueDate)}</p>
            </div>
            {task.completedDate && (
              <div className="col-span-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800">
                <span className="font-semibold">Completed Timestamp (Server Audit):</span>{' '}
                {new Date(task.completedDate).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Assigned Staff & Snapshot Audit Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
            Assigned Staff
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 font-bold flex items-center justify-center border border-brand-200">
                {assigneeName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <span>{assigneeName}</span>
                  {isDeletedAssignee && (
                    <span className="text-[10px] text-slate-400 italic font-normal">
                      (deleted)
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-slate-400">{assigneeId}</p>
              </div>
            </div>

            <p className="text-xs text-slate-500">{assigneeEmail}</p>

            {task.assignedEmployee?._id && (
              <div className="pt-3 border-t border-slate-100">
                <Link
                  to={`/employees/${task.assignedEmployee._id}`}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  View employee dossier <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 text-[11px] text-slate-500 leading-relaxed">
            <p className="font-medium text-slate-700 mb-0.5">Snapshot Audit Trail:</p>
            Employee details were permanently snapshotted upon task assignment so records remain verifiable even if employee profiles change.
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title={`Delete Task "${task.taskId}"?`}
        message={`Are you sure you want to delete "${task.title}"? If this task is active, the employee's active task counter will decrement automatically.`}
        confirmText="Delete Task"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}
