const jwt = require("jsonwebtoken");
const { User } = require("../models");

/**
 * Middleware to verify JWT token and authenticate user
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "imovies_fallback_secret"
      );

      // Find user and attach to request (excluding password)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User associated with this token no longer exists",
        });
      }

      next();
    } catch (error) {
      console.error("Token verification error:", error.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed or expired",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no bearer token provided",
    });
  }
};

/**
 * Middleware to restrict access to Admins only
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Access denied. Administrator privileges required.",
    });
  }
};

/**
 * Optional Authentication: Attaches user if valid token exists, but doesn't block if missing
 */
const optionalProtect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "imovies_fallback_secret"
      );
      req.user = await User.findById(decoded.id).select("-password");
    } catch (e) {
      // Token expired or invalid, ignore for optional routes
    }
  }
  next();
};

module.exports = { protect, admin, optionalProtect };

