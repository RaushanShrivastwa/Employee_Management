const Joi = require('joi');
const { DEPARTMENTS, EMPLOYEE_STATUSES } = require('../constants');

const employeeCreateSchema = Joi.object({
  employeeId: Joi.string().trim().uppercase().required().messages({
    'any.required': 'Employee ID is required',
    'string.empty': 'Employee ID cannot be empty'
  }),
  fullName: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Full Name is required',
    'string.min': 'Full Name must be at least 2 characters',
    'string.max': 'Full Name cannot exceed 100 characters'
  }),
  email: Joi.string().trim().lowercase().email().required().messages({
    'any.required': 'Email is required',
    'string.email': 'Please enter a valid email address'
  }),
  phone: Joi.string().trim().min(7).max(20).required().messages({
    'any.required': 'Phone number is required',
    'string.min': 'Phone number must be at least 7 characters'
  }),
  department: Joi.string().valid(...DEPARTMENTS).required().messages({
    'any.required': 'Department is required',
    'any.only': 'Invalid department selected'
  }),
  role: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Role is required'
  }),
  skills: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim()).default([]),
    Joi.string().allow('').default('')
  ),
  joiningDate: Joi.date().iso().required().messages({
    'any.required': 'Joining date is required',
    'date.format': 'Joining date must be a valid ISO date'
  }),
  status: Joi.string()
    .valid(...Object.values(EMPLOYEE_STATUSES))
    .default(EMPLOYEE_STATUSES.ACTIVE),
  leaveStart: Joi.date().iso().allow(null, '').default(null),
  leaveEnd: Joi.date().iso().allow(null, '').default(null)
}).custom((value, helpers) => {
  if (value.status === EMPLOYEE_STATUSES.ON_LEAVE) {
    if (!value.leaveStart || !value.leaveEnd) {
      return helpers.message('Both leave start and leave end dates are required when status is On Leave');
    }
    if (new Date(value.leaveEnd) < new Date(value.leaveStart)) {
      return helpers.message('Leave end date cannot be earlier than leave start date');
    }
  } else {
    // Clear leave dates if status is not On Leave
    value.leaveStart = null;
    value.leaveEnd = null;
  }
  return value;
});

const employeeUpdateSchema = Joi.object({
  employeeId: Joi.string().trim().uppercase(),
  fullName: Joi.string().trim().min(2).max(100),
  email: Joi.string().trim().lowercase().email(),
  phone: Joi.string().trim().min(7).max(20),
  department: Joi.string().valid(...DEPARTMENTS),
  role: Joi.string().trim().min(2).max(100),
  skills: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim()),
    Joi.string().allow('')
  ),
  joiningDate: Joi.date().iso(),
  status: Joi.string().valid(...Object.values(EMPLOYEE_STATUSES)),
  leaveStart: Joi.date().iso().allow(null, ''),
  leaveEnd: Joi.date().iso().allow(null, '')
}).custom((value, helpers) => {
  if (value.status === EMPLOYEE_STATUSES.ON_LEAVE) {
    if (!value.leaveStart || !value.leaveEnd) {
      return helpers.message('Both leave start and leave end dates are required when status is On Leave');
    }
    if (new Date(value.leaveEnd) < new Date(value.leaveStart)) {
      return helpers.message('Leave end date cannot be earlier than leave start date');
    }
  } else if (value.status && value.status !== EMPLOYEE_STATUSES.ON_LEAVE) {
    value.leaveStart = null;
    value.leaveEnd = null;
  }
  return value;
});

module.exports = {
  employeeCreateSchema,
  employeeUpdateSchema
};
