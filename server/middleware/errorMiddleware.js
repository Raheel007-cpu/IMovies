// Not Found 404 Handler
const notFound = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Centralized Security-Aware Error Handler
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "An unexpected internal server error occurred";

  // Mongoose Bad ObjectId (CastError)
  if (err.name === "CastError") {
    statusCode = 404;
    message = `Resource not found: Invalid ${err.path} format`;
  }

  // Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value error: A record with that ${field} already exists.`;
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  }

  // JWT Token Invalid Error
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Not authorized: Invalid security token format.";
  }

  // JWT Token Expired Error
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Not authorized: Session expired. Please log in again.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Never expose stack traces in production to prevent source path disclosure
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
