/**
 * Centralized error-handling middleware.
 * All async errors caught by controllers should call next(error).
 * This middleware formats the response consistently.
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log full error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[ERROR]', err);
  } else {
    console.error(`[ERROR] ${err.message}`);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      messages,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      error: 'Duplicate Key',
      message: `A record with this ${field} already exists.`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid Token',
      message: 'Authentication token is invalid.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token Expired',
      message: 'Authentication token has expired.',
    });
  }

  // Express-validator errors (passed manually)
  if (err.type === 'VALIDATION') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      messages: err.messages,
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
