const express = require("express");
const router = express.Router();
const {
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
} = require("../controllers/theatreController");
const { protect, admin } = require("../middleware/authMiddleware");

router.get("/", getTheatres);
router.get("/:id", getTheatreById);

router.post("/", protect, admin, createTheatre);
router.put("/:id", protect, admin, updateTheatre);

module.exports = router;

