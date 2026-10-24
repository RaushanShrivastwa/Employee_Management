const Employee = require('../models/Employee');
const Task = require('../models/Task');
const { getOverdueMongoQuery } = require('../utils/dateHelpers');
const { EMPLOYEE_STATUSES, TASK_STATUSES, ACTIVE_TASK_STATUSES } = require('../constants');

class DashboardService {
  /**
   * Aggregates key system metrics for the dashboard
   */
  async getDashboardMetrics() {
    const today = new Date();
    const overdueQuery = getOverdueMongoQuery(today);

    // Parallelize aggregation pipelines
    const [
      totalEmployees,
      employeesByStatus,
      totalTasks,
      tasksByStatus,
      overdueTasksCount,
      employeeWorkload,
      departmentWorkload,
      priorityDistribution
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Task.countDocuments(),
      Task.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Task.countDocuments(overdueQuery),
      Employee.aggregate([
        {
          $project: {
            employeeId: 1,
            fullName: 1,
            department: 1,
            status: 1,
            activeTaskCount: 1,
            capacity: { $literal: 3 }
          }
        },
        { $sort: { activeTaskCount: -1, fullName: 1 } }
      ]),
      Task.aggregate([
        { $match: { status: { $in: ACTIVE_TASK_STATUSES } } },
        { $group: { _id: '$department', activeTasks: { $sum: 1 } } },
        { $sort: { activeTasks: -1 } }
      ]),
      Task.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ])
    ]);

    // Format employee status breakdown
    const employeeStatusMap = {
      [EMPLOYEE_STATUSES.ACTIVE]: 0,
      [EMPLOYEE_STATUSES.INACTIVE]: 0,
      [EMPLOYEE_STATUSES.ON_LEAVE]: 0
    };
    employeesByStatus.forEach(item => {
      if (item._id) employeeStatusMap[item._id] = item.count;
    });

    // Format task status breakdown
    const taskStatusMap = {
      [TASK_STATUSES.TODO]: 0,
      [TASK_STATUSES.IN_PROGRESS]: 0,
      [TASK_STATUSES.COMPLETED]: 0,
      [TASK_STATUSES.CANCELLED]: 0
    };
    tasksByStatus.forEach(item => {
      if (item._id) taskStatusMap[item._id] = item.count;
    });

    return {
      summary: {
        totalEmployees,
        activeEmployees: employeeStatusMap[EMPLOYEE_STATUSES.ACTIVE],
        inactiveEmployees: employeeStatusMap[EMPLOYEE_STATUSES.INACTIVE],
        onLeaveEmployees: employeeStatusMap[EMPLOYEE_STATUSES.ON_LEAVE],
        totalTasks,
        todoTasks: taskStatusMap[TASK_STATUSES.TODO],
        inProgressTasks: taskStatusMap[TASK_STATUSES.IN_PROGRESS],
        completedTasks: taskStatusMap[TASK_STATUSES.COMPLETED],
        cancelledTasks: taskStatusMap[TASK_STATUSES.CANCELLED],
        overdueTasks: overdueTasksCount
      },
      employeeStatusBreakdown: employeeStatusMap,
      taskStatusBreakdown: taskStatusMap,
      employeeWorkload,
      departmentWorkload,
      priorityDistribution
    };
  }
}

module.exports = new DashboardService();
