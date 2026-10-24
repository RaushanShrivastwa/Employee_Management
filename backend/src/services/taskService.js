const Task = require('../models/Task');
const Employee = require('../models/Employee');
const Counter = require('../models/Counter');
const AppError = require('../utils/AppError');
const {
  TASK_STATUSES,
  EMPLOYEE_STATUSES,
  TRANSITIONS,
  MAX_ACTIVE_TASKS_PER_EMPLOYEE,
  ACTIVE_TASK_STATUSES
} = require('../constants');
const { isDateWithinRange, doDateRangesOverlap, formatDateOnly } = require('../utils/dateHelpers');
const { buildTaskQuery, buildSortOptions, ALLOWED_TASK_SORT_FIELDS } = require('../utils/queryBuilder');
const { generateTasksCsv } = require('../utils/csv');

class TaskService {
  /**
   * Helper: Validate employee availability for task assignment based on status & leave dates
   */
  async validateEmployeeForAssignment(employeeId, taskStartDate, taskDueDate = null) {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new AppError('Assigned employee not found', 404);
    }

    if (employee.status === EMPLOYEE_STATUSES.INACTIVE) {
      throw new AppError(`Cannot assign task: employee '${employee.fullName}' is Inactive.`, 400);
    }

    if (employee.status === EMPLOYEE_STATUSES.ON_LEAVE) {
      if (employee.leaveStart && employee.leaveEnd) {
        const startsInsideLeave = isDateWithinRange(taskStartDate, employee.leaveStart, employee.leaveEnd);
        const overlapsLeave = taskDueDate
          ? doDateRangesOverlap(taskStartDate, taskDueDate, employee.leaveStart, employee.leaveEnd)
          : startsInsideLeave;

        if (startsInsideLeave || overlapsLeave) {
          const startStr = formatDateOnly(employee.leaveStart);
          const endStr = formatDateOnly(employee.leaveEnd);
          const taskStartStr = formatDateOnly(taskStartDate);
          const taskDueStr = taskDueDate ? formatDateOnly(taskDueDate) : taskStartStr;
          throw new AppError(
            `Cannot assign task: employee '${employee.fullName}' is On Leave from ${startStr} to ${endStr}. Task period (${taskStartStr} to ${taskDueStr}) conflicts with their leave period.`,
            400
          );
        }
      }
    }

    return employee;
  }

  /**
   * List tasks with server-side filtering, sorting, pagination, search, and overdue computation
   */
  async listTasks(queryParams) {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(queryParams.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = buildTaskQuery(queryParams);
    const sort = buildSortOptions(
      queryParams.sortBy || 'createdAt',
      queryParams.order || 'desc',
      ALLOWED_TASK_SORT_FIELDS
    );

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedEmployee', 'employeeId fullName email department status')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Task.countDocuments(filter)
    ]);

    return {
      tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Get single task by ID
   */
  async getTaskById(id) {
    const task = await Task.findById(id).populate('assignedEmployee', 'employeeId fullName email department status');
    if (!task) {
      throw new AppError('Task not found', 404);
    }
    return task;
  }

  /**
   * Create task with atomic capacity check and auto-increment task ID
   */
  async createTask(data) {
    const { title, description, assignedEmployee, department, priority, startDate, dueDate } = data;

    // Validate date logic
    if (new Date(dueDate) < new Date(startDate)) {
      throw new AppError('Due date must be greater than or equal to start date', 400);
    }

    // Rule: Validate employee availability (active status & leave dates)
    const emp = await this.validateEmployeeForAssignment(assignedEmployee, startDate, dueDate);

    // Rule: Atomic Capacity Check & Increment
    // Prevents race conditions where two simultaneous requests see 2 active tasks and both increment
    const updatedEmp = await Employee.findOneAndUpdate(
      {
        _id: assignedEmployee,
        status: { $in: [EMPLOYEE_STATUSES.ACTIVE, EMPLOYEE_STATUSES.ON_LEAVE] },
        activeTaskCount: { $lt: MAX_ACTIVE_TASKS_PER_EMPLOYEE }
      },
      { $inc: { activeTaskCount: 1 } },
      { new: true }
    );

    if (!updatedEmp) {
      throw new AppError(
        `Employee '${emp.fullName}' has reached the maximum capacity of ${MAX_ACTIVE_TASKS_PER_EMPLOYEE} active tasks.`,
        400
      );
    }

    let createdTask;
    try {
      // Generate atomic taskId e.g. TSK-001
      const taskId = await Counter.getNextSequence('taskId');

      // Create task with initial status Todo
      createdTask = await Task.create({
        taskId,
        title,
        description,
        assignedEmployee,
        employeeSnapshot: {
          employeeId: emp.employeeId,
          fullName: emp.fullName,
          email: emp.email
        },
        department,
        priority,
        status: TASK_STATUSES.TODO,
        startDate,
        dueDate
      });

      return await Task.findById(createdTask._id).populate('assignedEmployee', 'employeeId fullName email department status');
    } catch (err) {
      // Rollback activeTaskCount if task creation failed
      await Employee.findByIdAndUpdate(assignedEmployee, { $inc: { activeTaskCount: -1 } });
      throw err;
    }
  }

  /**
   * Update task details (status changes rejected here)
   */
  async updateTask(id, data) {
    const existing = await Task.findById(id);
    if (!existing) {
      throw new AppError('Task not found', 404);
    }

    // Rule: Completed and Cancelled tasks are terminal and cannot be edited
    if (existing.status === TASK_STATUSES.COMPLETED || existing.status === TASK_STATUSES.CANCELLED) {
      throw new AppError(`Cannot edit a task with status '${existing.status}'. It is in a terminal state.`, 400);
    }

    // Rule: Status is changed ONLY through PUT /api/tasks/:id/status
    if (data.status !== undefined && data.status !== existing.status) {
      throw new AppError('Task status cannot be updated through the normal update API. Use PUT /api/tasks/:id/status.', 400);
    }
    if (data.completedDate !== undefined) {
      throw new AppError('Completed Date is set exclusively by the backend when a task becomes Completed.', 400);
    }
    delete data.status;
    delete data.completedDate;

    const newStartDate = data.startDate ? new Date(data.startDate) : existing.startDate;
    const newDueDate = data.dueDate ? new Date(data.dueDate) : existing.dueDate;

    if (newDueDate < newStartDate) {
      throw new AppError('Due date must be greater than or equal to start date', 400);
    }

    const isReassigning = data.assignedEmployee && String(data.assignedEmployee) !== String(existing.assignedEmployee);
    const isStartDateChanged = data.startDate && new Date(data.startDate).getTime() !== new Date(existing.startDate).getTime();
    const isDueDateChanged = data.dueDate && new Date(data.dueDate).getTime() !== new Date(existing.dueDate).getTime();

    let targetEmployeeId = existing.assignedEmployee;

    if (isReassigning) {
      targetEmployeeId = data.assignedEmployee;
      // Validate new employee availability against task schedule
      const newEmp = await this.validateEmployeeForAssignment(targetEmployeeId, newStartDate, newDueDate);

      // If existing task is active (Todo or In Progress), we must transfer capacity atomically
      if (ACTIVE_TASK_STATUSES.includes(existing.status)) {
        const incremented = await Employee.findOneAndUpdate(
          {
            _id: targetEmployeeId,
            status: { $in: [EMPLOYEE_STATUSES.ACTIVE, EMPLOYEE_STATUSES.ON_LEAVE] },
            activeTaskCount: { $lt: MAX_ACTIVE_TASKS_PER_EMPLOYEE }
          },
          { $inc: { activeTaskCount: 1 } },
          { new: true }
        );

        if (!incremented) {
          throw new AppError(
            `Target employee '${newEmp.fullName}' has reached maximum capacity of ${MAX_ACTIVE_TASKS_PER_EMPLOYEE} active tasks.`,
            400
          );
        }

        // Decrement previous employee
        if (existing.assignedEmployee) {
          await Employee.findByIdAndUpdate(existing.assignedEmployee, { $inc: { activeTaskCount: -1 } });
        }
      }

      // Update employee snapshot
      data.employeeSnapshot = {
        employeeId: newEmp.employeeId,
        fullName: newEmp.fullName,
        email: newEmp.email
      };
    } else if ((isStartDateChanged || isDueDateChanged) && existing.assignedEmployee) {
      // Re-validate leave window if start date or due date moved
      await this.validateEmployeeForAssignment(existing.assignedEmployee, newStartDate, newDueDate);
    }

    const updatedTask = await Task.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    }).populate('assignedEmployee', 'employeeId fullName email department status');

    return updatedTask;
  }

  /**
   * Update task status using strict TRANSITIONS state machine
   */
  async updateTaskStatus(id, newStatus) {
    const task = await Task.findById(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const currentStatus = task.status;
    const allowedTransitions = TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new AppError(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: [${allowedTransitions.join(', ') || 'None'}]`,
        400
      );
    }

    task.status = newStatus;

    // If moving to Completed: set backend-only completedDate & decrement employee activeTaskCount
    if (newStatus === TASK_STATUSES.COMPLETED) {
      task.completedDate = new Date();
      if (task.assignedEmployee) {
        await Employee.findByIdAndUpdate(task.assignedEmployee, {
          $inc: { activeTaskCount: -1 }
        });
      }
    }

    // If moving to Cancelled from an active status: decrement employee activeTaskCount
    if (newStatus === TASK_STATUSES.CANCELLED) {
      if (ACTIVE_TASK_STATUSES.includes(currentStatus) && task.assignedEmployee) {
        await Employee.findByIdAndUpdate(task.assignedEmployee, {
          $inc: { activeTaskCount: -1 }
        });
      }
    }

    await task.save();

    return await Task.findById(id).populate('assignedEmployee', 'employeeId fullName email department status');
  }

  /**
   * Delete task
   * If task was active, decrement employee activeTaskCount
   */
  async deleteTask(id) {
    const task = await Task.findById(id);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    if (ACTIVE_TASK_STATUSES.includes(task.status) && task.assignedEmployee) {
      await Employee.findByIdAndUpdate(task.assignedEmployee, {
        $inc: { activeTaskCount: -1 }
      });
    }

    await Task.findByIdAndDelete(id);

    return {
      message: `Task ${task.taskId} deleted successfully`,
      deletedTaskId: id
    };
  }

  /**
   * Export tasks as CSV based on query filters (matches list view, no pagination)
   */
  async exportCsv(queryParams) {
    const filter = buildTaskQuery(queryParams);
    const sort = buildSortOptions(
      queryParams.sortBy || 'createdAt',
      queryParams.order || 'desc',
      ALLOWED_TASK_SORT_FIELDS
    );

    const tasks = await Task.find(filter)
      .populate('assignedEmployee', 'employeeId fullName email role phone department status')
      .sort(sort);

    return generateTasksCsv(tasks);
  }
}

module.exports = new TaskService();
