const employeeService = require('../services/employeeService');

class EmployeeController {
  async list(req, res, next) {
    try {
      const result = await employeeService.listEmployees(req.query);
      res.status(200).json({
        success: true,
        data: result.employees,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await employeeService.getEmployeeById(req.params.id);
      res.status(200).json({
        success: true,
        data: result.employee,
        tasks: result.tasks
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const employee = await employeeService.createEmployee(req.body);
      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const employee = await employeeService.updateEmployee(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Employee updated successfully',
        data: employee
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await employeeService.deleteEmployee(req.params.id);
      res.status(200).json({
        success: true,
        message: result.message,
        deletedEmployeeId: result.deletedEmployeeId
      });
    } catch (error) {
      next(error);
    }
  }

  async getOptions(req, res, next) {
    try {
      const options = await employeeService.getEmployeeOptions();
      res.status(200).json({
        success: true,
        data: options
      });
    } catch (error) {
      next(error);
    }
  }

  async exportCsv(req, res, next) {
    try {
      const csvContent = await employeeService.exportCsv(req.query);
      const filename = `employees_export_${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send('\uFEFF' + csvContent);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmployeeController();
