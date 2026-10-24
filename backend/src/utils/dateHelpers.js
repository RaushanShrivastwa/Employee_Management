const { TASK_STATUSES } = require('../constants');

/**
 * Returns today's date normalized to midnight (00:00:00.000)
 */
const getTodayStart = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Check if a task is overdue based on dueDate < today and active status (Todo / In Progress)
 * Note: Overdue is NEVER persisted in DB.
 */
const isOverdue = (task, today = new Date()) => {
  if (!task || !task.dueDate) return false;
  const isPast = new Date(task.dueDate) < getTodayStart(today);
  const isActive = task.status === TASK_STATUSES.TODO || task.status === TASK_STATUSES.IN_PROGRESS;
  return Boolean(isPast && isActive);
};

/**
 * MongoDB query fragment matching overdue tasks
 */
const getOverdueMongoQuery = (today = new Date()) => {
  return {
    dueDate: { $lt: getTodayStart(today) },
    status: { $in: [TASK_STATUSES.TODO, TASK_STATUSES.IN_PROGRESS] }
  };
};

/**
 * Normalizes a date to midnight UTC (00:00:00.000)
 */
const getDayStartUTC = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

/**
 * Normalizes a date to end of day UTC (23:59:59.999)
 */
const getDayEndUTC = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
};

/**
 * Checks if targetDate falls inclusively inside [startDate, endDate] normalized to full calendar days
 */
const isDateWithinRange = (targetDate, startDate, endDate) => {
  if (!targetDate || !startDate || !endDate) return false;
  const target = getDayStartUTC(targetDate).getTime();
  const start = getDayStartUTC(startDate).getTime();
  const end = getDayEndUTC(endDate).getTime();
  return target >= start && target <= end;
};

/**
 * Checks if two date intervals overlap inclusively across calendar day boundaries
 */
const doDateRangesOverlap = (startA, endA, startB, endB) => {
  if (!startA || !startB) return false;
  const sA = getDayStartUTC(startA).getTime();
  const eA = getDayEndUTC(endA || startA).getTime();
  const sB = getDayStartUTC(startB).getTime();
  const eB = getDayEndUTC(endB || startB).getTime();
  return sA <= eB && eA >= sB;
};

/**
 * Format a Date to YYYY-MM-DD string
 */
const formatDateOnly = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

module.exports = {
  getTodayStart,
  getDayStartUTC,
  getDayEndUTC,
  isOverdue,
  getOverdueMongoQuery,
  isDateWithinRange,
  doDateRangesOverlap,
  formatDateOnly
};
