import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { employeeApi } from '../../api/employeeApi';
import { taskApi } from '../../api/taskApi';
import { DEPARTMENTS, EMPLOYEE_STATUSES } from '../../utils/constants';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import PageLoader from '../../components/common/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmployeeCard from './EmployeeCard';
import TaskCard from '../tasks/TaskCard';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Filter,
  Users,
  LayoutGrid,
  List,
  CheckSquare,
  ArrowRight,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeeListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Query Parameters
  const search = searchParams.get('search') || '';
  const department = searchParams.get('department') || '';
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '8', 10);

  const [viewMode, setViewMode] = useState('grid');
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 400);

  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 8 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Associated tasks for searched employee
  const [associatedTasks, setAssociatedTasks] = useState([]);

  // Delete state
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      await employeeApi.downloadCsv({
        search,
        department,
        status
      });
      toast.success('Employees exported to CSV successfully');
    } catch (err) {
      toast.error(err.userMessage || 'Failed to export employees');
    } finally {
      setExporting(false);
    }
  };

  // Synchronize debounced input with URL
  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    if (debouncedSearch !== currentSearch) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedSearch) {
          next.set('search', debouncedSearch);
        } else {
          next.delete('search');
        }
        next.set('page', '1');
        return next;
      }, { replace: true });
    }
  }, [debouncedSearch]);

  const [refreshKey, setRefreshKey] = useState(0);

  // Load employees from server
  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    const currentDept = searchParams.get('department') || '';
    const currentStatus = searchParams.get('status') || '';
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const currentLimit = parseInt(searchParams.get('limit') || '8', 10);

    const loadData = async () => {
      try {
        setLoading(true);
        const empPromise = employeeApi.getEmployees({
          search: currentSearch,
          department: currentDept,
          status: currentStatus,
          page: currentPage,
          limit: currentLimit
        });

        // If searching an employee, also load tasks assigned to them to show below their card
        const taskPromise = currentSearch.trim()
          ? taskApi.getTasks({ search: currentSearch.trim(), limit: 4 })
          : Promise.resolve({ data: [] });

        const [empRes, taskRes] = await Promise.all([empPromise, taskPromise]);

        setEmployees(empRes.data);
        setPagination(empRes.pagination);
        setAssociatedTasks(taskRes?.data || []);
      } catch (err) {
        toast.error(err.userMessage || 'Failed to fetch employees');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchParams, refreshKey]);

  const updateParam = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.set('page', '1');
      return next;
    }, { replace: true });
  };

  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
  };

  const handleLimitChange = (newLimit) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('limit', String(newLimit));
      next.set('page', '1');
      return next;
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    try {
      setIsDeleting(true);
      const res = await employeeApi.deleteEmployee(deleteCandidate._id);
      toast.success(res.message || 'Employee deleted successfully');
      setDeleteCandidate(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      toast.error(err.userMessage || 'Cannot delete employee');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasSearch = Boolean(search.trim());

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-300">
      {/* Top Header - No icon before Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Employees
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
            disabled={exporting || employees.length === 0}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200/80 rounded-2xl hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
            title="Export filtered employees to CSV"
          >
            {exporting ? (
              <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-brand-600 rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-slate-400" />
            )}
            <span>Export CSV</span>
          </button>

          <Link
            to="/employees/new"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-brand-600 rounded-2xl hover:bg-brand-700 transition shadow-sm shadow-brand-600/20"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, position, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition text-slate-700 placeholder-slate-400"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Filter */}
          <div className="w-full sm:w-44">
            <select
              value={department}
              onChange={(e) => updateParam('department', e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition text-slate-700"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-36">
            <select
              value={status}
              onChange={(e) => updateParam('status', e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition text-slate-700"
            >
              <option value="">All Statuses</option>
              {Object.values(EMPLOYEE_STATUSES).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <PageLoader message="Loading employees..." />
      ) : employees.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={Users}
            title="No employees found"
            description={
              hasSearch
                ? `No employee profile matched "${search}".`
                : 'No employee records matched your filters.'
            }
            actionLabel="Add New Employee"
            actionTo="/employees/new"
          />
          {hasSearch && (
            <div className="text-center">
              <Link
                to={`/tasks?search=${encodeURIComponent(search)}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 px-4 py-2 rounded-2xl border border-brand-100"
              >
                <span>Looking for a task instead? Search Tasks for &ldquo;{search}&rdquo;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* SECTION 1: EMPLOYEE CARDS */}
          {viewMode === 'grid' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {employees.map((emp) => (
                  <EmployeeCard
                    key={emp._id}
                    emp={emp}
                    onDelete={(e) => setDeleteCandidate(e)}
                    showDelete={true}
                  />
                ))}
              </div>

              {/* Server Pagination */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  limit={pagination.limit}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                />
              </div>
            </div>
          ) : (
            /* List Table View */
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 min-w-[680px]">
                  <thead className="bg-[#f8f9fd] text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-6">Employee ID</th>
                      <th className="py-3.5 px-6">Full Name & Email</th>
                      <th className="py-3.5 px-6">Department</th>
                      <th className="py-3.5 px-6">Role</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6">Active Tasks</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map((emp) => (
                      <tr key={emp._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-6 font-mono font-semibold text-xs text-brand-600">
                          {emp.employeeId}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-900">{emp.fullName}</div>
                          <div className="text-xs text-slate-400">{emp.email}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-slate-700">{emp.department}</span>
                        </td>
                        <td className="py-4 px-6 text-slate-600">{emp.role}</td>
                        <td className="py-4 px-6">
                          <StatusBadge status={emp.status} />
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  emp.activeTaskCount >= 3
                                    ? 'bg-rose-500'
                                    : emp.activeTaskCount === 2
                                    ? 'bg-amber-500'
                                    : 'bg-brand-600'
                                }`}
                                style={{ width: `${Math.min(100, ((emp.activeTaskCount || 0) / 3) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-700">
                              {emp.activeTaskCount || 0} / 3
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/employees/${emp._id}`}
                              title="View profile and assigned tasks"
                              className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              to={`/employees/${emp._id}/edit`}
                              title="Edit employee"
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => setDeleteCandidate(emp)}
                              title="Delete employee"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
            </div>
          )}

          {/* SECTION 2: ASSIGNED TASKS (When searching an employee name) */}
          {hasSearch && associatedTasks.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200/70">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
                    <CheckSquare className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      Tasks Assigned to {employees.map((e) => e.fullName).join(', ')} ({associatedTasks.length})
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Deliverables currently owned by the searched employee
                    </p>
                  </div>
                </div>
                <Link
                  to={`/tasks?search=${encodeURIComponent(search)}`}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Manage all tasks →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {associatedTasks.map((task) => (
                  <TaskCard key={task._id} task={task} showDelete={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {(() => {
        const hasTasks = Boolean(
          deleteCandidate?.hasAssignedTasks ||
          (deleteCandidate?.totalTaskCount > 0) ||
          (deleteCandidate?.activeTaskCount > 0)
        );
        const taskCount = deleteCandidate?.totalTaskCount || deleteCandidate?.activeTaskCount || 1;
        return (
          <ConfirmDialog
            isOpen={Boolean(deleteCandidate)}
            isBlocked={hasTasks}
            title={
              hasTasks
                ? `Cannot Delete "${deleteCandidate?.fullName}"`
                : `Delete Employee "${deleteCandidate?.fullName}"?`
            }
            message={
              hasTasks
                ? `Candidate "${deleteCandidate?.fullName}" (${deleteCandidate?.employeeId}) has ${taskCount} assigned task(s) in the system. According to the assignment business rules, employees who have assigned tasks cannot be deleted.`
                : `Are you sure you want to permanently delete ${deleteCandidate?.fullName} (${deleteCandidate?.employeeId})? This action cannot be undone.`
            }
            confirmText="Confirm Delete"
            isLoading={isDeleting}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteCandidate(null)}
          />
        );
      })()}
    </div>
  );
}
