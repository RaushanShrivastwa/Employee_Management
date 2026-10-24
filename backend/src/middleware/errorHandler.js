const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // MongoDB duplicate key error (Code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    const value = err.keyValue ? err.keyValue[field] : '';
    const message = `An employee with ${field} '${value}' already exists.`;
    error = new AppError(message, 409);
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new AppError(message, 400);
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((el) => el.message);
    const message = messages[0] || 'Validation error';
    error = new AppError(message, 400, messages);
  }

  // In development, log the stack
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR 💥:', err);
  }

  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    status: error.status || 'error',
    message: error.message || 'Internal server error',
    details: error.details || null,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
