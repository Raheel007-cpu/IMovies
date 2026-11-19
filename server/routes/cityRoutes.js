const express = require("express");
const router = express.Router();
const { getCities, createCity } = require("../controllers/cityController");
const { protect, admin } = require("../middleware/authMiddleware");

router.get("/", getCities);
router.post("/", protect, admin, createCity);

module.exports = router;

