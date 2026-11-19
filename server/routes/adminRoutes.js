const express = require("express");
const router = express.Router();
const {
  getAdminStats,
  getAllBookings,
  createScreenWithSeats,
} = require("../controllers/adminController");
const { protect, admin } = require("../middleware/authMiddleware");

// All admin routes strictly enforce JWT authentication and Admin role
router.use(protect, admin);

router.get("/stats", getAdminStats);
router.get("/bookings", getAllBookings);
router.post("/theatres/:theatreId/screens", createScreenWithSeats);

module.exports = router;

