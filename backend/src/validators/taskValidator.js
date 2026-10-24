const Joi = require('joi');
const { DEPARTMENTS, TASK_PRIORITIES, TASK_STATUSES } = require('../constants');

const taskCreateSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).required().messages({
    'any.required': 'Task title is required',
    'string.min': 'Title must be at least 3 characters',
    'string.max': 'Title cannot exceed 100 characters'
  }),
  description: Joi.string().trim().allow('').max(1000).default(''),
  assignedEmployee: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'any.required': 'Assigned employee is required',
    'string.pattern.base': 'Invalid employee ID format'
  }),
  department: Joi.string().valid(...DEPARTMENTS).required().messages({
    'any.required': 'Department is required',
    'any.only': 'Invalid department selected'
  }),
  priority: Joi.string()
    .valid(...Object.values(TASK_PRIORITIES))
    .default(TASK_PRIORITIES.MEDIUM),
  startDate: Joi.date().iso().required().messages({
    'any.required': 'Start date is required'
  }),
  dueDate: Joi.date().iso().required().messages({
    'any.required': 'Due date is required'
  }),
  // Prevent client from setting status or completedDate on creation
  status: Joi.any().forbidden().messages({
    'any.unknown': 'Task status cannot be set on creation. New tasks default to Todo.'
  }),
  completedDate: Joi.any().forbidden().messages({
    'any.unknown': 'Completed date cannot be set directly by client.'
  })
}).custom((value, helpers) => {
  if (new Date(value.dueDate) < new Date(value.startDate)) {
    return helpers.message('Due date must be greater than or equal to start date');
  }
  return value;
});

const taskUpdateSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100),
  description: Joi.string().trim().allow('').max(1000),
  assignedEmployee: Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
    'string.pattern.base': 'Invalid employee ID format'
  }),
  department: Joi.string().valid(...DEPARTMENTS),
  priority: Joi.string().valid(...Object.values(TASK_PRIORITIES)),
  startDate: Joi.date().iso(),
  dueDate: Joi.date().iso(),
  // Strict rule: status cannot be updated via PUT /api/tasks/:id
  status: Joi.any().forbidden().messages({
    'any.unknown': 'Status cannot be updated through this endpoint. Use PUT /api/tasks/:id/status'
  }),
  completedDate: Joi.any().forbidden().messages({
    'any.unknown': 'Completed date cannot be updated directly'
  })
}).custom((value, helpers) => {
  if (value.startDate && value.dueDate) {
    if (new Date(value.dueDate) < new Date(value.startDate)) {
      return helpers.message('Due date must be greater than or equal to start date');
    }
  }
  return value;
});

const taskStatusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(TASK_STATUSES))
    .required()
    .messages({
      'any.required': 'New status is required',
      'any.only': 'Invalid task status'
    })
});

module.exports = {
  taskCreateSchema,
  taskUpdateSchema,
  taskStatusUpdateSchema
};
