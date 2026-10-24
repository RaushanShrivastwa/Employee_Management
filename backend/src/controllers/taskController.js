const taskService = require('../services/taskService');

class TaskController {
  async list(req, res, next) {
    try {
      const result = await taskService.listTasks(req.query);
      res.status(200).json({
        success: true,
        data: result.tasks,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const task = await taskService.getTaskById(req.params.id);
      res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const task = await taskService.createTask(req.body);
      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const task = await taskService.updateTask(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const task = await taskService.updateTaskStatus(req.params.id, req.body.status);
      res.status(200).json({
        success: true,
        message: `Task status updated to ${req.body.status}`,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await taskService.deleteTask(req.params.id);
      res.status(200).json({
        success: true,
        message: result.message,
        deletedTaskId: result.deletedTaskId
      });
    } catch (error) {
      next(error);
    }
  }

  async exportCsv(req, res, next) {
    try {
      const csvContent = await taskService.exportCsv(req.query);
      const filename = `tasks_export_${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send('\uFEFF' + csvContent);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TaskController();
