const { formatDateOnly, isOverdue } = require('./dateHelpers');

/**
 * Escapes a single cell value for CSV:
 * 1. Prevents CSV Formula Injection (=, +, -, @, \t, \r)
 * 2. Escapes double quotes by doubling them
 * 3. Wraps value in double quotes if it contains commas, newlines, or quotes
 */
const escapeCsvCell = (value) => {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // CSV Formula Injection mitigation: prefix potentially executable symbols with single quote
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousPrefixes.some(prefix => str.startsWith(prefix))) {
    str = `'${str}`;
  }

  // Double up any quotes
  str = str.replace(/"/g, '""');

  return `"${str}"`;
};

/**
 * Generates comprehensive Tasks CSV content string
 * Includes every single task parameter, assignee profile, and dates
 */
const generateTasksCsv = (tasks = []) => {
  const headers = [
    'Task ID',
    'Title',
    'Description',
    'Department',
    'Priority',
    'Status',
    'Is Overdue',
    'Assigned Employee ID',
    'Assigned Employee Name',
    'Assigned Employee Email',
    'Assigned Employee Role',
    'Assigned Employee Phone',
    'Start Date',
    'Due Date',
    'Created Date',
    'Completed Date'
  ];

  const headerRow = headers.map(escapeCsvCell).join(',');

  const dataRows = tasks.map((task) => {
    const overdue = isOverdue(task) ? 'Yes' : 'No';
    const empId = task.employeeSnapshot?.employeeId || (task.assignedEmployee?.employeeId || 'N/A');
    const empName = task.employeeSnapshot?.fullName || (task.assignedEmployee?.fullName || 'N/A');
    const empEmail = task.employeeSnapshot?.email || (task.assignedEmployee?.email || 'N/A');
    const empRole = task.assignedEmployee?.role || 'N/A';
    const empPhone = task.assignedEmployee?.phone || 'N/A';

    const cells = [
      task.taskId || 'N/A',
      task.title || 'N/A',
      task.description || '',
      task.department || 'N/A',
      task.priority || 'N/A',
      task.status || 'N/A',
      overdue,
      empId,
      empName,
      empEmail,
      empRole,
      empPhone,
      formatDateOnly(task.startDate),
      formatDateOnly(task.dueDate),
      formatDateOnly(task.createdAt),
      task.completedDate ? formatDateOnly(task.completedDate) : 'N/A'
    ];

    return cells.map(escapeCsvCell).join(',');
  });

  return [headerRow, ...dataRows].join('\r\n');
};

/**
 * Generates comprehensive Employees CSV content string
 */
const generateEmployeesCsv = (employees = []) => {
  const headers = [
    'Employee ID',
    'Full Name',
    'Email',
    'Phone',
    'Department',
    'Role',
    'Status',
    'Active Tasks Count',
    'Date of Joining',
    'Leave Start',
    'Leave End',
    'Skills',
    'Registered Date'
  ];

  const headerRow = headers.map(escapeCsvCell).join(',');

  const dataRows = employees.map((emp) => {
    const cells = [
      emp.employeeId || 'N/A',
      emp.fullName || 'N/A',
      emp.email || 'N/A',
      emp.phone || 'N/A',
      emp.department || 'N/A',
      emp.role || 'N/A',
      emp.status || 'N/A',
      emp.activeTaskCount || 0,
      formatDateOnly(emp.joiningDate),
      emp.leaveStart ? formatDateOnly(emp.leaveStart) : 'N/A',
      emp.leaveEnd ? formatDateOnly(emp.leaveEnd) : 'N/A',
      Array.isArray(emp.skills) ? emp.skills.join(', ') : '',
      formatDateOnly(emp.createdAt)
    ];

    return cells.map(escapeCsvCell).join(',');
  });

  return [headerRow, ...dataRows].join('\r\n');
};

module.exports = {
  escapeCsvCell,
  generateTasksCsv,
  generateEmployeesCsv
};
