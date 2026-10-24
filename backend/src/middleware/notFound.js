const AppError = require('../utils/AppError');

const notFound = (req, res, next) => {
  next(new AppError(`Cannot find endpoint ${req.originalUrl} on this server`, 404));
};

module.exports = notFound;
