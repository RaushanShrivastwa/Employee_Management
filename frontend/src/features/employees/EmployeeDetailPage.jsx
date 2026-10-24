import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { employeeApi } from '../../api/employeeApi';
import { formatDate } from '../../utils/formatDate';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import PageLoader from '../../components/common/PageLoader';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Edit2,
  Trash2,
  CheckSquare,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await employeeApi.getEmployeeById(id);
      setEmployee(res.data);
      setTasks(res.tasks || []);
    } catch (err) {
      toast.error(err.userMessage || 'Employee not found');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await employeeApi.deleteEmployee(id);
      toast.success(res.message || 'Employee deleted successfully');
      navigate('/employees');
    } catch (err) {
      toast.error(err.userMessage || 'Cannot delete employee with active tasks');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) return <PageLoader message="Loading employee dossier..." />;
  if (!employee) return null;

  const activeTasks = tasks.filter((t) => t.status === 'Todo' || t.status === 'In Progress');
  const pastTasks = tasks.filter((t) => t.status === 'Completed' || t.status === 'Cancelled');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/employees"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{employee.fullName}</h1>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                {employee.employeeId}
              </span>
              <StatusBadge status={employee.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{employee.role} • {employee.department}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/employees/${id}/edit`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </Link>
          <button
            onClick={() => setDeleteDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Profile Dossier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
            Employee Profile
          </h2>

          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Email Address</p>
                <p className="font-medium text-slate-800">{employee.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Phone</p>
                <p className="font-medium text-slate-800">{employee.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Briefcase className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Department & Role</p>
                <p className="font-medium text-slate-800">{employee.department} — {employee.role}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Joining Date</p>
                <p className="font-medium text-slate-800">{formatDate(employee.joiningDate)}</p>
              </div>
            </div>
          </div>

          {/* Leave Window if on leave */}
          {employee.status === 'On Leave' && (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>On Leave Schedule</span>
              </div>
              <p>
                From <span className="font-medium">{formatDate(employee.leaveStart)}</span> to{' '}
                <span className="font-medium">{formatDate(employee.leaveEnd)}</span>
              </p>
              <p className="text-[11px] text-amber-700">New assignments starting in this window are blocked.</p>
            </div>
          )}

          {/* Skills */}
          {employee.skills && employee.skills.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Skills & Tech Stack
              </p>
              <div className="flex flex-wrap gap-1.5">
                {employee.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Active Capacity Indicator */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-700">Concurrent Task Capacity</span>
              <span className="font-bold text-slate-900">{employee.activeTaskCount || 0} / 3 Tasks</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  (employee.activeTaskCount || 0) >= 3 ? 'bg-rose-500' : 'bg-brand-500'
                }`}
                style={{ width: `${Math.min(100, ((employee.activeTaskCount || 0) / 3) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Assigned Tasks List (2 columns wide) */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex items-center justify-between px-6 pt-4 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-6 text-sm font-semibold">
              <button
                onClick={() => setActiveTab('active')}
                className={`pb-3 border-b-2 transition flex items-center gap-2 ${
                  activeTab === 'active'
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Active Assignments</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {activeTasks.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('completed')}
                className={`pb-3 border-b-2 transition flex items-center gap-2 ${
                  activeTab === 'completed'
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Completed & History</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {pastTasks.length}
                </span>
              </button>
            </div>

            <Link
              to="/tasks/new"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 pb-3"
            >
              + Assign Task
            </Link>
          </div>

          {/* Tab Content */}
          <div className="p-6 flex-1">
            {activeTab === 'active' ? (
              activeTasks.length === 0 ? (
                <EmptyState
                  icon={CheckSquare}
                  title="No active tasks assigned"
                  description="This employee has full capacity to accept up to 3 tasks."
                  actionLabel="Assign Task"
                  actionTo="/tasks/new"
                />
              ) : (
                <div className="space-y-3">
                  {activeTasks.map((task) => (
                    <div
                      key={task._id}
                      className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand-600">{task.taskId}</span>
                          <StatusBadge status={task.status} />
                          <PriorityBadge priority={task.priority} />
                          {task.isOverdue && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                              Overdue
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-slate-900 text-sm">{task.title}</h3>
                        <p className="text-xs text-slate-500">
                          Due on <span className="font-medium text-slate-700">{formatDate(task.dueDate)}</span>
                        </p>
                      </div>

                      <Link
                        to={`/tasks/${task._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition self-start sm:self-auto"
                      >
                        <span>Manage</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )
            ) : pastTasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No completed or cancelled tasks"
                description="Past records will automatically archive here once tasks reach terminal states."
              />
            ) : (
              <div className="space-y-3">
                {pastTasks.map((task) => (
                  <div
                    key={task._id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">{task.taskId}</span>
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                      </div>
                      <h3 className="font-semibold text-slate-800 text-sm">{task.title}</h3>
                      <p className="text-xs text-slate-400">
                        {task.completedDate ? `Completed on ${formatDate(task.completedDate)}` : `Cancelled`}
                      </p>
                    </div>

                    <Link
                      to={`/tasks/${task._id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition self-start sm:self-auto"
                    >
                      <span>View Audit</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {(() => {
        const hasTasks = Boolean(tasks.length > 0 || (employee.activeTaskCount > 0));
        return (
          <ConfirmDialog
            isOpen={deleteDialogOpen}
            isBlocked={hasTasks}
            title={
              hasTasks
                ? `Cannot Delete "${employee.fullName}"`
                : `Delete Employee "${employee.fullName}"?`
            }
            message={
              hasTasks
                ? `Candidate "${employee.fullName}" (${employee.employeeId}) has ${tasks.length} assigned task(s) in the system. According to the assignment business rules, employees who have assigned tasks cannot be deleted.`
                : `Are you sure you want to permanently delete ${employee.fullName} (${employee.employeeId})? This action cannot be undone.`
            }
            isLoading={isDeleting}
            onConfirm={handleDelete}
            onCancel={() => setDeleteDialogOpen(false)}
          />
        );
      })()}
    </div>
  );
}
