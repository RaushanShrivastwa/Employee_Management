import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { taskApi } from '../../api/taskApi';
import { employeeApi } from '../../api/employeeApi';
import { useTaskFilters } from '../../hooks/useTaskFilters';
import { useDebounce } from '../../hooks/useDebounce';
import {
  DEPARTMENTS,
  TASK_PRIORITIES,
  TASK_STATUSES
} from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import StatusDropdown from '../../components/common/StatusDropdown';
import Pagination from '../../components/common/Pagination';
import PageLoader from '../../components/common/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmployeeCard from '../employees/EmployeeCard';
import TaskCard from './TaskCard';
import {
  Search,
  Plus,
  Download,
  Filter,
  RotateCcw,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  LayoutGrid,
  List,
  Clock,
  User,
  CheckSquare,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TaskListPage() {
  const { filters, setFilter, setMultipleFilters, resetFilters } = useTaskFilters();

  const [viewMode, setViewMode] = useState('grid');
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 400);

  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 8 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Matching employee state when searching by employee name
  const [matchedEmployees, setMatchedEmployees] = useState([]);

  // Delete state
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync debounced search to URL
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilter('search', debouncedSearch);
    }
  }, [debouncedSearch]);

  // Load tasks and check for matching employees when URL parameters change
  useEffect(() => {
    fetchTasksAndEmployees();
  }, [
    filters.search,
    filters.department,
    filters.priority,
    filters.status,
    filters.isOverdue,
    filters.dueFrom,
    filters.dueTo,
    filters.sortBy,
    filters.order,
    filters.page,
    filters.limit
  ]);

  const fetchTasksAndEmployees = async () => {
    try {
      setLoading(true);

      const trimmedSearch = filters.search?.trim();

      // Parallel fetch tasks and (if searching) matching employees
      const taskPromise = taskApi.getTasks(filters);
      const employeePromise = trimmedSearch
        ? employeeApi.getEmployees({ search: trimmedSearch, limit: 4 })
        : Promise.resolve({ data: [] });

      const [taskRes, empRes] = await Promise.all([taskPromise, employeePromise]);

      setTasks(taskRes.data);
      setPagination(taskRes.pagination);
      setMatchedEmployees(empRes?.data || []);
    } catch (err) {
      toast.error(err.userMessage || 'Failed to load deliverables');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskApi.updateTaskStatus(taskId, newStatus);
      toast.success(`Task moved to ${newStatus}`);
      fetchTasksAndEmployees();
    } catch (err) {
      toast.error(err.userMessage || 'Status transition not permitted');
    }
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      await taskApi.downloadCsv(filters);
      toast.success('Tasks exported to CSV successfully');
    } catch (err) {
      toast.error(err.userMessage || 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    try {
      setIsDeleting(true);
      const res = await taskApi.deleteTask(deleteCandidate._id);
      toast.success(res.message || 'Task deleted successfully');
      setDeleteCandidate(null);
      fetchTasksAndEmployees();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasSearch = Boolean(filters.search?.trim());
  const hasMatchedEmployees = hasSearch && matchedEmployees.length > 0;

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-300">
      {/* Top Header - No icon before Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Tasks
          </h1>
          {/* View Toggle */}
          <div className="flex items-center bg-white border border-slate-200/80 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-brand-50 text-brand-600 font-medium'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-brand-50 text-brand-600 font-medium'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportCsv}
            disabled={exporting || tasks.length === 0}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200/80 rounded-2xl hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
            title="Export filtered records to CSV"
          >
            {exporting ? (
              <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-brand-600 rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-slate-400" />
            )}
            <span>Export CSV</span>
          </button>

          <Link
            to="/tasks/new"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-brand-600 rounded-2xl hover:bg-brand-700 transition shadow-sm shadow-brand-600/20"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by employee name, role, task title or ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition text-slate-700 placeholder-slate-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition text-slate-700"
          >
            <option value="">All Statuses</option>
            {Object.values(TASK_STATUSES).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={filters.priority}
            onChange={(e) => setFilter('priority', e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition text-slate-700"
          >
            <option value="">All Priorities</option>
            {Object.values(TASK_PRIORITIES).map((pr) => (
              <option key={pr} value={pr}>
                {pr}
              </option>
            ))}
          </select>

          {/* Department */}
          <select
            value={filters.department}
            onChange={(e) => setFilter('department', e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition text-slate-700"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Overdue Only Button */}
          <button
            onClick={() => setFilter('isOverdue', filters.isOverdue ? '' : 'true')}
            className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-2xl border transition flex items-center gap-1.5 ${
              filters.isOverdue
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${filters.isOverdue ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>Overdue</span>
          </button>

          {/* Reset Filters */}
          <button
            onClick={resetFilters}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition"
            title="Reset all filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <PageLoader message="Searching records..." />
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: MATCHING EMPLOYEE DETAILS CARD (Only if employee name was searched) */}
          {hasMatchedEmployees && (
            <div className="space-y-3.5 bg-brand-50/40 p-4 sm:p-5 rounded-3xl border border-brand-100/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-brand-600 text-white">
                    <User className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                      Matching Employee Profile{matchedEmployees.length > 1 ? 's' : ''} ({matchedEmployees.length})
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Found profile matching &ldquo;{filters.search}&rdquo;
                    </p>
                  </div>
                </div>
                <Link
                  to={`/employees?search=${encodeURIComponent(filters.search)}`}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline hidden sm:inline"
                >
                  View in Directory →
                </Link>
              </div>

              {/* Responsive Employee Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {matchedEmployees.map((emp) => (
                  <EmployeeCard key={emp._id} emp={emp} showDelete={false} />
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: TASK DELIVERABLES (Assigned Tasks or General Tasks) */}
          <div className="space-y-4">
            {/* Context Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  {hasMatchedEmployees
                    ? `Tasks Assigned to ${matchedEmployees.map((e) => e.fullName).join(', ')}`
                    : hasSearch
                    ? `Tasks Matching "${filters.search}"`
                    : 'All Deliverables'}
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {pagination.total} {pagination.total === 1 ? 'task' : 'tasks'}
                </span>
              </div>
            </div>

            {/* Empty State */}
            {tasks.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title={
                  hasMatchedEmployees
                    ? `No tasks assigned to ${matchedEmployees[0]?.fullName}`
                    : 'No tasks match your search'
                }
                description={
                  hasMatchedEmployees
                    ? `${matchedEmployees[0]?.fullName} currently has no tasks assigned. You can assign a new deliverable now.`
                    : 'Try checking for typos or searching by a different title or employee name.'
                }
                actionLabel="Create New Task"
                actionTo="/tasks/new"
              />
            ) : viewMode === 'grid' ? (
              /* Grid View with TaskCard */
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onDelete={(t) => setDeleteCandidate(t)}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    limit={pagination.limit}
                    onPageChange={(p) => setFilter('page', String(p))}
                    onLimitChange={(l) => {
                      setMultipleFilters({ limit: String(l), page: '1' });
                    }}
                  />
                </div>
              </div>
            ) : (
              /* Table View */
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 min-w-[760px]">
                    <thead className="bg-[#f8f9fd] text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-3.5 px-6">Task ID</th>
                        <th className="py-3.5 px-6">Title</th>
                        <th className="py-3.5 px-6">Department</th>
                        <th className="py-3.5 px-6">Assignee</th>
                        <th className="py-3.5 px-6">Priority</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6">Due Date</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tasks.map((task) => (
                        <tr key={task._id} className="hover:bg-slate-50/70 transition">
                          <td className="py-4 px-6 font-mono font-semibold text-xs text-brand-600">
                            {task.taskId}
                          </td>
                          <td className="py-4 px-6 font-medium text-slate-900 max-w-xs truncate">
                            {task.title}
                          </td>
                          <td className="py-4 px-6 text-slate-600">{task.department}</td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-slate-800 text-xs">
                              {task.employeeSnapshot?.fullName || 'Unassigned'}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {task.employeeSnapshot?.employeeId}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <PriorityBadge priority={task.priority} />
                          </td>
                          <td className="py-4 px-6">
                            <StatusDropdown
                              status={task.status}
                              onStatusChange={(newStatus) => handleStatusChange(task._id, newStatus)}
                            />
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-600">
                            <div className={task.isOverdue ? 'text-rose-600 font-bold' : ''}>
                              {formatDate(task.dueDate)}
                              {task.isOverdue && ' (Overdue)'}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                to={`/tasks/${task._id}`}
                                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                                title="View task details"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                to={`/tasks/${task._id}/edit`}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="Edit task"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => setDeleteCandidate(task)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete task"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  limit={pagination.limit}
                  onPageChange={(p) => setFilter('page', String(p))}
                  onLimitChange={(l) => {
                    setMultipleFilters({ limit: String(l), page: '1' });
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        title={`Delete Task "${deleteCandidate?.taskId}"?`}
        message={`Are you sure you want to delete "${deleteCandidate?.title}"? If this task is active, the assigned employee's task count will be automatically reduced by 1.`}
        confirmText="Confirm Delete"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteCandidate(null)}
      />
    </div>
  );
}
