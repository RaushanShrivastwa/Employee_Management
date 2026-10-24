const AppError = require('../utils/AppError');

/**
 * Express middleware to validate request payload against a Joi schema
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: false
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      const combinedMessage = errorMessages[0]; // Primary message for user-facing alert
      return next(new AppError(combinedMessage, 400, errorMessages));
    }

    req[source] = value;
    next();
  };
};

module.exports = validate;
