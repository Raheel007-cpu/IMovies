const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");

// Public routes (Rate-limited against brute-force attacks)
router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);

// Protected routes
router.get("/me", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

module.exports = router;

