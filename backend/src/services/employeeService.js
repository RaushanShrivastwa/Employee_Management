const Employee = require('../models/Employee');
const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const { escapeRegex, ALLOWED_EMPLOYEE_SORT_FIELDS, buildSortOptions } = require('../utils/queryBuilder');
const { EMPLOYEE_STATUSES, ACTIVE_TASK_STATUSES } = require('../constants');
const { generateEmployeesCsv } = require('../utils/csv');

class EmployeeService {
  /**
   * List employees with server-side filtering, search, pagination, and sorting
   */
  async listEmployees(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};

    // Search filter across fullName, email, employeeId, and role
    if (query.search && query.search.trim()) {
      const safeRegex = new RegExp(escapeRegex(query.search.trim()), 'i');
      filter.$or = [
        { fullName: safeRegex },
        { email: safeRegex },
        { employeeId: safeRegex },
        { role: safeRegex }
      ];
    }

    // Exact filters
    if (query.department) {
      filter.department = query.department;
    }
    if (query.status) {
      filter.status = query.status;
    }

    const sort = buildSortOptions(
      query.sortBy || 'createdAt',
      query.order || 'desc',
      ALLOWED_EMPLOYEE_SORT_FIELDS
    );

    const [employees, total] = await Promise.all([
      Employee.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Employee.countDocuments(filter)
    ]);

    // Annotate employees with task counts so UI knows if candidate has assigned tasks
    if (employees.length > 0) {
      const empIds = employees.map((e) => e._id);
      const taskCounts = await Task.aggregate([
        { $match: { assignedEmployee: { $in: empIds } } },
        {
          $group: {
            _id: '$assignedEmployee',
            totalCount: { $sum: 1 },
            activeCount: {
              $sum: { $cond: [{ $in: ['$status', ACTIVE_TASK_STATUSES] }, 1, 0] }
            }
          }
        }
      ]);

      const countMap = new Map();
      taskCounts.forEach((t) => {
        countMap.set(String(t._id), t);
      });

      employees.forEach((emp) => {
        const stats = countMap.get(String(emp._id));
        emp.totalTaskCount = stats ? stats.totalCount : 0;
        emp.hasAssignedTasks = (emp.totalTaskCount > 0) || ((emp.activeTaskCount || 0) > 0);
      });
    }

    return {
      employees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Get employee by ID along with their full task history
   */
  async getEmployeeById(id) {
    const employee = await Employee.findById(id).lean();
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Get all tasks assigned to this employee (or referencing snapshot employeeId)
    const tasks = await Task.find({
      $or: [
        { assignedEmployee: id },
        { 'employeeSnapshot.employeeId': employee.employeeId }
      ]
    }).sort({ createdAt: -1 });

    return {
      employee,
      tasks
    };
  }

  /**
   * Create new employee
   */
  async createEmployee(data) {
    // Trim & lowercase/uppercase
    const employeeData = {
      ...data,
      employeeId: data.employeeId.trim().toUpperCase(),
      email: data.email.trim().toLowerCase(),
      fullName: data.fullName.trim()
    };

    if (Array.isArray(employeeData.skills)) {
      employeeData.skills = employeeData.skills.map(s => s.trim()).filter(Boolean);
    } else if (typeof employeeData.skills === 'string') {
      employeeData.skills = employeeData.skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    const employee = await Employee.create(employeeData);
    return employee;
  }

  /**
   * Update employee details
   */
  async updateEmployee(id, data) {
    const existing = await Employee.findById(id);
    if (!existing) {
      throw new AppError('Employee not found', 404);
    }

    const updateData = { ...data };

    if (updateData.employeeId) {
      updateData.employeeId = updateData.employeeId.trim().toUpperCase();
    }
    if (updateData.email) {
      updateData.email = updateData.email.trim().toLowerCase();
    }
    if (updateData.fullName) {
      updateData.fullName = updateData.fullName.trim();
    }

    if (Array.isArray(updateData.skills)) {
      updateData.skills = updateData.skills.map(s => s.trim()).filter(Boolean);
    } else if (typeof updateData.skills === 'string') {
      updateData.skills = updateData.skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    // If status changed to non-leave, clear leave dates
    if (updateData.status && updateData.status !== EMPLOYEE_STATUSES.ON_LEAVE) {
      updateData.leaveStart = null;
      updateData.leaveEnd = null;
    }

    const updated = await Employee.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    // If employee name, id, or email changed, update snapshots in active tasks
    if (
      (updateData.fullName && updateData.fullName !== existing.fullName) ||
      (updateData.employeeId && updateData.employeeId !== existing.employeeId) ||
      (updateData.email && updateData.email !== existing.email)
    ) {
      await Task.updateMany(
        { assignedEmployee: id },
        {
          $set: {
            'employeeSnapshot.employeeId': updated.employeeId,
            'employeeSnapshot.fullName': updated.fullName,
            'employeeSnapshot.email': updated.email
          }
        }
      );
    }

    return updated;
  }

  /**
   * Delete employee
   * Business rule: Count Todo / In Progress tasks; block with 400 if > 0.
   * If 0 active tasks, hard delete employee.
   * Completed / Cancelled tasks retain employeeSnapshot for history display.
   */
  async deleteEmployee(id) {
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // 1. Rule: Block deletion if employee has active tasks (Todo / In Progress)
    const activeTasksCount = await Task.countDocuments({
      $or: [
        { assignedEmployee: id },
        { 'employeeSnapshot.employeeId': employee.employeeId }
      ],
      status: { $in: ACTIVE_TASK_STATUSES }
    });

    if (activeTasksCount > 0 || (employee.activeTaskCount || 0) > 0) {
      throw new AppError(
        `Cannot delete employee '${employee.fullName}'. They currently hold ${activeTasksCount || employee.activeTaskCount} active task(s) (Todo/In Progress). Business rules strictly forbid deleting employees with active tasks.`,
        400
      );
    }

    // 2. Rule: Block deletion if employee has any assigned tasks in the system
    const totalTasksCount = await Task.countDocuments({
      $or: [
        { assignedEmployee: id },
        { 'employeeSnapshot.employeeId': employee.employeeId }
      ]
    });

    if (totalTasksCount > 0) {
      throw new AppError(
        `Cannot delete employee '${employee.fullName}'. They have ${totalTasksCount} assigned task(s) in the system. Business rules forbid deleting candidates with assigned tasks.`,
        400
      );
    }

    await Employee.findByIdAndDelete(id);

    return {
      message: `Employee '${employee.fullName}' deleted successfully.`,
      deletedEmployeeId: id
    };
  }

  /**
   * Lightweight list of employees for dropdowns (shows active task counts and leave windows)
   */
  async getEmployeeOptions() {
    const employees = await Employee.find({}, '_id employeeId fullName email department status leaveStart leaveEnd activeTaskCount')
      .sort({ fullName: 1 })
      .lean();
    return employees;
  }

  /**
   * Export employees as CSV based on query filters
   */
  async exportCsv(query = {}) {
    const filter = {};
    if (query.search && query.search.trim()) {
      const safeRegex = new RegExp(escapeRegex(query.search.trim()), 'i');
      filter.$or = [
        { fullName: safeRegex },
        { email: safeRegex },
        { employeeId: safeRegex },
        { role: safeRegex }
      ];
    }
    if (query.department) filter.department = query.department;
    if (query.status) filter.status = query.status;

    const employees = await Employee.find(filter).sort({ createdAt: -1 });
    return generateEmployeesCsv(employees);
  }
}

module.exports = new EmployeeService();
