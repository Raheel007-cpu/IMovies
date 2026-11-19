const express = require("express");
const router = express.Router();
const {
  getMovies,
  getFeaturedMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  lookupImdb,
  getLiveMovieRating,
  syncMovieImdb,
} = require("../controllers/movieController");
const { protect, admin } = require("../middleware/authMiddleware");

// Public endpoints
router.get("/", getMovies);
router.get("/featured", getFeaturedMovies);
router.get("/imdb/lookup", lookupImdb);
router.get("/:id/live-rating", getLiveMovieRating);
router.get("/:id", getMovieById);

// Admin-only endpoints
router.post("/", protect, admin, createMovie);
router.post("/:id/sync-imdb", protect, admin, syncMovieImdb);
router.put("/:id", protect, admin, updateMovie);
router.delete("/:id", protect, admin, deleteMovie);

module.exports = router;

