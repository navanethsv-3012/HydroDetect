import { validationResult } from 'express-validator';

/**
 * Middleware that checks express-validator results.
 * Place after validation chains in route definitions.
 * Returns 400 with error messages if validation fails.
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      messages: errors.array().map((e) => e.msg),
    });
  }
  next();
};

export default validateRequest;
