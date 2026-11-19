const express = require("express");
const router = express.Router();
const {
  getShows,
  getShowById,
  createShow,
} = require("../controllers/showController");
const {
  getShowSeatLayout,
  holdSeats,
  releaseSeats,
} = require("../controllers/seatController");
const { protect, admin, optionalProtect } = require("../middleware/authMiddleware");
const { holdLimiter } = require("../middleware/rateLimiter");

// Shows Core Endpoints
router.get("/", getShows);
router.get("/:id", getShowById);
router.post("/", protect, admin, createShow);

// Concurrency-Safe Seat Reservation Endpoints
router.get("/:showId/seats", optionalProtect, getShowSeatLayout);
router.post("/:showId/hold", protect, holdLimiter, holdSeats);
router.post("/:showId/release", protect, releaseSeats);

module.exports = router;
