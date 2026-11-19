const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Movie title is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Movie description is required"],
      trim: true,
    },
    genre: {
      type: [String],
      required: [true, "At least one genre is required"],
      index: true,
    },
    language: {
      type: [String],
      required: [true, "At least one language is required"],
      index: true,
    },
    duration: {
      type: Number,
      required: [true, "Duration in minutes is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    releaseDate: {
      type: Date,
      required: [true, "Release date is required"],
    },
    posterUrl: {
      type: String,
      required: [true, "Poster URL is required"],
      trim: true,
    },
    bannerUrl: {
      type: String,
      trim: true,
    },
    trailerUrl: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    votesCount: {
      type: Number,
      default: 0,
    },
    imdbId: {
      type: String,
      trim: true,
    },
    imdbRating: {
      type: Number,
      default: 0,
    },
    imdbVotes: {
      type: String,
      trim: true,
    },
    lastImdbSync: {
      type: Date,
    },
    certificate: {
      type: String,
      enum: ["U", "UA", "A", "R", "PG-13"],
      default: "UA",
    },
    status: {
      type: String,
      enum: ["NOW_SHOWING", "UPCOMING", "ARCHIVED"],
      default: "NOW_SHOWING",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for movie search
// language_override: "none" prevents MongoDB from using the 'language' array as the text search stemming language
movieSchema.index(
  { title: "text", description: "text" },
  { language_override: "none" }
);

module.exports = mongoose.model("Movie", movieSchema);

