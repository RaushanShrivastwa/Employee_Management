const { getTodayStart, getOverdueMongoQuery } = require('./dateHelpers');
const { TASK_STATUSES } = require('../constants');

/**
 * Escapes regex special characters to prevent ReDoS / injection
 */
const escapeRegex = (string) => {
  if (!string || typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Whitelisted fields for sorting tasks
 */
const ALLOWED_TASK_SORT_FIELDS = [
  'createdAt',
  'dueDate',
  'startDate',
  'priorityRank',
  'title',
  'status',
  'department',
  'taskId'
];

/**
 * Whitelisted fields for sorting employees
 */
const ALLOWED_EMPLOYEE_SORT_FIELDS = [
  'createdAt',
  'employeeId',
  'fullName',
  'email',
  'department',
  'status',
  'joiningDate',
  'activeTaskCount'
];

/**
 * Builds standard Mongo filter object for Tasks (shared between list and CSV export)
 */
const buildTaskQuery = (queryParams = {}) => {
  const {
    search,
    department,
    priority,
    status,
    assignedEmployee,
    dueFrom,
    dueTo,
    isOverdue
  } = queryParams;

  const filter = {};

  // Text search on title, description, taskId, or snapshot name
  if (search && search.trim() !== '') {
    const safeRegex = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [
      { title: safeRegex },
      { description: safeRegex },
      { taskId: safeRegex },
      { 'employeeSnapshot.fullName': safeRegex },
      { 'employeeSnapshot.employeeId': safeRegex }
    ];
  }

  // Exact enum filters
  if (department) {
    filter.department = department;
  }
  if (priority) {
    filter.priority = priority;
  }
  if (status) {
    filter.status = status;
  }
  if (assignedEmployee) {
    filter.assignedEmployee = assignedEmployee;
  }

  // Due date range
  if (dueFrom || dueTo) {
    filter.dueDate = {};
    if (dueFrom) {
      const fromDate = new Date(dueFrom);
      fromDate.setUTCHours(0, 0, 0, 0);
      filter.dueDate.$gte = fromDate;
    }
    if (dueTo) {
      const toDate = new Date(dueTo);
      toDate.setUTCHours(23, 59, 59, 999);
      filter.dueDate.$lte = toDate;
    }
  }

  // Overdue filter (using the unified query fragment)
  if (isOverdue !== undefined && isOverdue !== '') {
    const overdueQuery = getOverdueMongoQuery();
    if (String(isOverdue) === 'true') {
      filter.dueDate = { ...(filter.dueDate || {}), $lt: overdueQuery.dueDate.$lt };
      filter.status = { $in: overdueQuery.status.$in };
    } else if (String(isOverdue) === 'false') {
      filter.$nor = [
        {
          dueDate: overdueQuery.dueDate,
          status: overdueQuery.status
        }
      ];
    }
  }

  return filter;
};

/**
 * Builds sort object with field whitelisting
 */
const buildSortOptions = (sortBy = 'createdAt', order = 'desc', allowedFields = ALLOWED_TASK_SORT_FIELDS) => {
  const validSortField = allowedFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortDirection = order === 'asc' ? 1 : -1;
  return { [validSortField]: sortDirection };
};

module.exports = {
  escapeRegex,
  ALLOWED_TASK_SORT_FIELDS,
  ALLOWED_EMPLOYEE_SORT_FIELDS,
  buildTaskQuery,
  buildSortOptions
};
