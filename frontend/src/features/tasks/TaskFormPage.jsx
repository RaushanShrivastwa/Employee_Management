import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { taskApi } from '../../api/taskApi';
import { employeeApi } from '../../api/employeeApi';
import { DEPARTMENTS, TASK_PRIORITIES } from '../../utils/constants';
import { toInputDateFormat } from '../../utils/formatDate';
import FormField from '../../components/common/FormField';
import PageLoader from '../../components/common/PageLoader';
import { ArrowLeft, Save, AlertCircle, Info, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TaskFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const [employeeOptions, setEmployeeOptions] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedEmployee: '',
    department: 'Development',
    priority: 'Medium',
    startDate: toInputDateFormat(new Date()),
    dueDate: toInputDateFormat(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  });

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    initPage();
  }, [id]);

  const initPage = async () => {
    try {
      setLoading(true);
      const employees = await employeeApi.getEmployeeOptions();
      setEmployeeOptions(employees || []);

      if (isEdit) {
        const res = await taskApi.getTaskById(id);
        const task = res.data;

        // Terminal check
        if (task.status === 'Completed' || task.status === 'Cancelled') {
          toast.error(`Cannot edit a task that is ${task.status}.`);
          navigate(`/tasks/${id}`);
          return;
        }

        setFormData({
          title: task.title || '',
          description: task.description || '',
          assignedEmployee: task.assignedEmployee?._id || task.assignedEmployee || '',
          department: task.department || 'Development',
          priority: task.priority || 'Medium',
          startDate: toInputDateFormat(task.startDate),
          dueDate: toInputDateFormat(task.dueDate)
        });
      } else if (employees && employees.length > 0) {
        // Default to first active employee with available capacity
        const availableEmp = employees.find(
          (e) => e.status === 'Active' && (e.activeTaskCount || 0) < 3
        );
        if (availableEmp) {
          setFormData((prev) => ({ ...prev, assignedEmployee: availableEmp._id }));
        }
      }
    } catch (err) {
      toast.error(err.userMessage || 'Failed to initialize form');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const isEmployeeOnLeaveDuring = (emp, startDate, dueDate) => {
    if (!emp || emp.status !== 'On Leave' || !emp.leaveStart || !emp.leaveEnd || !startDate) {
      return false;
    }
    const tStart = new Date(startDate).setUTCHours(0, 0, 0, 0);
    const tDue = new Date(dueDate || startDate).setUTCHours(23, 59, 59, 999);
    const lStart = new Date(emp.leaveStart).setUTCHours(0, 0, 0, 0);
    const lEnd = new Date(emp.leaveEnd).setUTCHours(23, 59, 59, 999);

    return tStart <= lEnd && tDue >= lStart;
  };

  const validateClient = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Task title is required';
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    } else if (formData.title.trim().length > 100) {
      errors.title = 'Title cannot exceed 100 characters';
    }

    if (!formData.assignedEmployee) {
      errors.assignedEmployee = 'Please assign an employee to this task';
    } else if (formData.startDate) {
      const targetEmp = employeeOptions.find((e) => String(e._id) === String(formData.assignedEmployee));
      if (targetEmp && isEmployeeOnLeaveDuring(targetEmp, formData.startDate, formData.dueDate)) {
        const lStartStr = new Date(targetEmp.leaveStart).toISOString().split('T')[0];
        const lEndStr = new Date(targetEmp.leaveEnd).toISOString().split('T')[0];
        errors.assignedEmployee = `${targetEmp.fullName} is On Leave from ${lStartStr} to ${lEndStr}. Cannot assign work during this period.`;
      }
    }

    if (!formData.department) errors.department = 'Department is required';
    if (!formData.priority) errors.priority = 'Priority is required';
    if (!formData.startDate) errors.startDate = 'Start date is required';
    if (!formData.dueDate) errors.dueDate = 'Due date is required';

    if (formData.startDate && formData.dueDate) {
      if (new Date(formData.dueDate) < new Date(formData.startDate)) {
        errors.dueDate = 'Due date must be greater than or equal to start date';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateClient()) {
      toast.error('Please resolve the errors highlighted below');
      return;
    }

    try {
      setSubmitting(true);
      if (isEdit) {
        await taskApi.updateTask(id, formData);
        toast.success('Task details updated successfully');
      } else {
        await taskApi.createTask(formData);
        toast.success('Task created successfully with status Todo');
      }
      navigate('/tasks');
    } catch (err) {
      setServerError(err.userMessage || 'Task creation/update failed');
      toast.error(err.userMessage || 'Operation rejected');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader message="Loading task details & staff capacity..." />;

  // Find currently selected employee info
  const selectedEmp = employeeOptions.find((e) => String(e._id) === String(formData.assignedEmployee));

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/tasks"
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isEdit ? 'Update Task Parameters' : 'Create New Deliverable'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isEdit
              ? 'Modify title, description, dates, or reassign employee'
              : 'Tasks automatically initialize in Todo status with capacity validation'}
          </p>
        </div>
      </div>

      {/* Server Rule Error Banner */}
      {serverError && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Business Rule Violation</p>
            <p className="mt-0.5 text-xs text-rose-700">{serverError}</p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Title */}
        <FormField
          label="Task Title"
          id="title"
          required
          error={fieldErrors.title}
          helpText="Clear summary of what needs to be delivered (3 to 100 characters)"
        >
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Implement MongoDB Transaction Fallback"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </FormField>

        {/* Description */}
        <FormField
          label="Description & Acceptance Criteria"
          id="description"
          error={fieldErrors.description}
        >
          <textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed requirements, edge cases, and expected outcomes..."
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Department */}
          <FormField
            label="Department"
            id="department"
            required
            error={fieldErrors.department}
          >
            <select
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </FormField>

          {/* Priority */}
          <FormField
            label="Priority Level"
            id="priority"
            required
            error={fieldErrors.priority}
          >
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              {Object.values(TASK_PRIORITIES).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </FormField>

          {/* Start Date */}
          <FormField
            label="Start Date"
            id="startDate"
            required
            error={fieldErrors.startDate}
          >
            <input
              type="date"
              id="startDate"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </FormField>

          {/* Due Date */}
          <FormField
            label="Due Date"
            id="dueDate"
            required
            error={fieldErrors.dueDate}
            helpText="Must be greater than or equal to start date"
          >
            <input
              type="date"
              id="dueDate"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </FormField>
        </div>

        {/* Assigned Employee Dropdown with Capacity Display */}
        <div className="pt-2">
          <FormField
            label="Assigned Employee"
            id="assignedEmployee"
            required
            error={fieldErrors.assignedEmployee}
            helpText="Only staff with available capacity (< 3 tasks) and not currently on leave during start date can be assigned"
          >
            <select
              id="assignedEmployee"
              value={formData.assignedEmployee}
              onChange={(e) => setFormData({ ...formData, assignedEmployee: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="">Select Employee...</option>
              {employeeOptions.map((emp) => {
                const count = emp.activeTaskCount || 0;
                const isFull = count >= 3;
                const isOnLeaveConflict = isEmployeeOnLeaveDuring(emp, formData.startDate, formData.dueDate);
                let tag = '';
                if (emp.status === 'Inactive') {
                  tag = ' [Inactive]';
                } else if (emp.status === 'On Leave') {
                  const lStartStr = emp.leaveStart ? new Date(emp.leaveStart).toISOString().split('T')[0] : '';
                  const lEndStr = emp.leaveEnd ? new Date(emp.leaveEnd).toISOString().split('T')[0] : '';
                  tag = isOnLeaveConflict
                    ? ` [ON LEAVE: ${lStartStr} to ${lEndStr}]`
                    : ` [On Leave: ${lStartStr} to ${lEndStr}]`;
                }

                return (
                  <option
                    key={emp._id}
                    value={emp._id}
                    disabled={isFull || emp.status === 'Inactive' || isOnLeaveConflict}
                  >
                    {emp.fullName} ({emp.department}) — {count}/3 active{tag}
                    {isFull ? ' (CAPACITY FULL)' : ''}
                    {isOnLeaveConflict ? ' (ON LEAVE - UNAVAILABLE)' : ''}
                  </option>
                );
              })}
            </select>
          </FormField>

          {/* Visual capacity preview for selected employee */}
          {selectedEmp && (
            <div className="mt-3 space-y-2">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800">{selectedEmp.fullName}</span>
                  <span className="text-slate-500 ml-2">({selectedEmp.department} • {selectedEmp.status})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-700">
                    Current Load: {selectedEmp.activeTaskCount || 0} / 3 Tasks
                  </span>
                  {(selectedEmp.activeTaskCount || 0) >= 3 && (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      AT CAPACITY
                    </span>
                  )}
                </div>
              </div>

              {isEmployeeOnLeaveDuring(selectedEmp, formData.startDate, formData.dueDate) && (
                <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Employee is On Leave</p>
                    <p className="mt-0.5 text-amber-700">
                      {selectedEmp.fullName} is on leave from{' '}
                      <strong>{new Date(selectedEmp.leaveStart).toISOString().split('T')[0]}</strong> to{' '}
                      <strong>{new Date(selectedEmp.leaveEnd).toISOString().split('T')[0]}</strong>. You cannot assign work that starts or falls within this leave period.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <Link
            to="/tasks"
            className="px-5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition shadow-sm disabled:opacity-50"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEdit ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
}
