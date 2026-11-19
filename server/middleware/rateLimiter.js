const rateLimit = require("express-rate-limit");

/**
 * General API Rate Limiter
 * 300 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});

/**
 * Authentication Rate Limiter (Brute-force protection)
 * 15 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login/registration attempts. For security, please try again after 15 minutes.",
  },
});

/**
 * Seat-Hold Rate Limiter (Bot and hoarding prevention)
 * 30 requests per 5 minutes per IP
 */
const holdLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many seat hold requests. Please wait a moment before trying again.",
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  holdLimiter,
};
