import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { employeeApi } from '../../api/employeeApi';
import { DEPARTMENTS, EMPLOYEE_STATUSES } from '../../utils/constants';
import { toInputDateFormat } from '../../utils/formatDate';
import FormField from '../../components/common/FormField';
import PageLoader from '../../components/common/PageLoader';
import { ArrowLeft, Save, AlertCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeeFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    phone: '',
    department: 'Development',
    role: '',
    skills: '',
    joiningDate: toInputDateFormat(new Date()),
    status: EMPLOYEE_STATUSES.ACTIVE,
    leaveStart: '',
    leaveEnd: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      loadEmployee();
    }
  }, [id]);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      const res = await employeeApi.getEmployeeById(id);
      const emp = res.data;
      setFormData({
        employeeId: emp.employeeId || '',
        fullName: emp.fullName || '',
        email: emp.email || '',
        phone: emp.phone || '',
        department: emp.department || 'Development',
        role: emp.role || '',
        skills: Array.isArray(emp.skills) ? emp.skills.join(', ') : '',
        joiningDate: toInputDateFormat(emp.joiningDate),
        status: emp.status || EMPLOYEE_STATUSES.ACTIVE,
        leaveStart: toInputDateFormat(emp.leaveStart),
        leaveEnd: toInputDateFormat(emp.leaveEnd)
      });
    } catch (err) {
      toast.error(err.userMessage || 'Failed to load employee details');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  const validateClient = () => {
    const errors = {};
    if (!formData.employeeId.trim()) errors.employeeId = 'Employee ID is required';
    if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.role.trim()) errors.role = 'Role is required';
    if (!formData.joiningDate) errors.joiningDate = 'Joining date is required';

    if (formData.status === EMPLOYEE_STATUSES.ON_LEAVE) {
      if (!formData.leaveStart) errors.leaveStart = 'Leave start date is required for On Leave status';
      if (!formData.leaveEnd) errors.leaveEnd = 'Leave end date is required for On Leave status';
      if (formData.leaveStart && formData.leaveEnd && new Date(formData.leaveEnd) < new Date(formData.leaveStart)) {
        errors.leaveEnd = 'Leave end date cannot be earlier than leave start date';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateClient()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        employeeId: formData.employeeId.trim().toUpperCase(),
        email: formData.email.trim().toLowerCase(),
        skills: formData.skills
          ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : []
      };

      if (formData.status !== EMPLOYEE_STATUSES.ON_LEAVE) {
        payload.leaveStart = null;
        payload.leaveEnd = null;
      }

      if (isEdit) {
        await employeeApi.updateEmployee(id, payload);
        toast.success('Employee updated successfully');
      } else {
        await employeeApi.createEmployee(payload);
        toast.success('Employee created successfully');
      }
      navigate('/employees');
    } catch (err) {
      setServerError(err.userMessage || 'An error occurred while saving employee');
      toast.error(err.userMessage || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader message="Loading employee information..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/employees"
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isEdit ? 'Edit Employee Details' : 'Register New Employee'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isEdit
              ? `Update profile information for ${formData.fullName} (${formData.employeeId})`
              : 'Add an employee to the directory with departmental role and status'}
          </p>
        </div>
      </div>

      {/* Server Error Alert Banner */}
      {serverError && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Operation Rejected by Server Rules</p>
            <p className="mt-0.5 text-xs text-rose-700">{serverError}</p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Employee ID */}
          <FormField
            label="Employee ID"
            id="employeeId"
            required
            error={fieldErrors.employeeId}
            helpText="Unique business ID (e.g. EMP-001)"
          >
            <input
              type="text"
              id="employeeId"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              placeholder="e.g. EMP-001"
              className="w-full px-3.5 py-2 text-sm uppercase bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </FormField>

          {/* Full Name */}
          <FormField
            label="Full Name"
            id="fullName"
            required
            error={fieldErrors.fullName}
          >
            <input
              type="text"
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Aarav Sharma"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </FormField>

          {/* Email */}
          <FormField
            label="Email Address"
            id="email"
            required
            error={fieldErrors.email}
            helpText="Case-insensitive unique identifier"
          >
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. aarav.sharma@rootsmedia.com"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </FormField>

          {/* Phone */}
          <FormField
            label="Phone Number"
            id="phone"
            required
            error={fieldErrors.phone}
          >
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +91-9876543210"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </FormField>

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

          {/* Role */}
          <FormField
            label="Role / Title"
            id="role"
            required
            error={fieldErrors.role}
          >
            <input
              type="text"
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g. Senior Full Stack Engineer"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </FormField>

          {/* Joining Date */}
          <FormField
            label="Joining Date"
            id="joiningDate"
            required
            error={fieldErrors.joiningDate}
          >
            <input
              type="date"
              id="joiningDate"
              value={formData.joiningDate}
              onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </FormField>

          {/* Status */}
          <FormField
            label="Employee Status"
            id="status"
            required
            error={fieldErrors.status}
          >
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              {Object.values(EMPLOYEE_STATUSES).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Conditional On Leave Date Range */}
        {formData.status === EMPLOYEE_STATUSES.ON_LEAVE && (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Leave Window Specification (Inclusive)</span>
            </div>
            <p className="text-xs text-amber-700">
              Tasks cannot be scheduled to start on any date within this window.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Leave Start Date"
                id="leaveStart"
                required
                error={fieldErrors.leaveStart}
              >
                <input
                  type="date"
                  id="leaveStart"
                  value={formData.leaveStart}
                  onChange={(e) => setFormData({ ...formData, leaveStart: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </FormField>

              <FormField
                label="Leave End Date"
                id="leaveEnd"
                required
                error={fieldErrors.leaveEnd}
              >
                <input
                  type="date"
                  id="leaveEnd"
                  value={formData.leaveEnd}
                  onChange={(e) => setFormData({ ...formData, leaveEnd: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </FormField>
            </div>
          </div>
        )}

        {/* Skills */}
        <FormField
          label="Skills (comma-separated)"
          id="skills"
          helpText="e.g. React, Node.js, MongoDB, TypeScript, Docker"
        >
          <input
            type="text"
            id="skills"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            placeholder="React, Node.js, TypeScript, MongoDB"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </FormField>

        {/* Buttons */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <Link
            to="/employees"
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
            {isEdit ? 'Save Changes' : 'Register Employee'}
          </button>
        </div>
      </form>
    </div>
  );
}
