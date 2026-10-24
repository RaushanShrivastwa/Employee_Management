export const DEPARTMENTS = ['Development', 'Design', 'QA', 'HR', 'Sales'];

export const EMPLOYEE_STATUSES = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ON_LEAVE: 'On Leave'
};

export const TASK_STATUSES = {
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

export const TRANSITIONS = {
  [TASK_STATUSES.TODO]: [TASK_STATUSES.IN_PROGRESS, TASK_STATUSES.CANCELLED],
  [TASK_STATUSES.IN_PROGRESS]: [TASK_STATUSES.COMPLETED, TASK_STATUSES.CANCELLED],
  [TASK_STATUSES.COMPLETED]: [],
  [TASK_STATUSES.CANCELLED]: []
};

export const TASK_PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

export const STATUS_COLORS = {
  // Employee statuses
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
  Inactive: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/20',
  'On Leave': 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',

  // Task statuses
  Todo: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20',
  'In Progress': 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/20',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20'
};

export const PRIORITY_COLORS = {
  Low: 'bg-slate-50 text-slate-600 border-slate-200',
  Medium: 'bg-blue-50 text-blue-700 border-blue-200',
  High: 'bg-amber-50 text-amber-700 border-amber-200',
  Critical: 'bg-rose-50 text-rose-700 border-rose-300 font-semibold'
};
