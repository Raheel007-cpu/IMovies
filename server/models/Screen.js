const mongoose = require("mongoose");

const screenSchema = new mongoose.Schema(
  {
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theatre",
      required: [true, "Theatre reference is required"],
      index: true,
    },
    screenNumber: {
      type: String,
      required: [true, "Screen number is required"],
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: function () {
        return `Screen ${this.screenNumber}`;
      },
    },
    soundSystem: {
      type: String,
      default: "Dolby Atmos 7.1",
    },
    projectionType: {
      type: String,
      default: "4K Laser Digital",
    },
    totalSeats: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate screen numbers in the same theatre
screenSchema.index({ theatre: 1, screenNumber: 1 }, { unique: true });

module.exports = mongoose.model("Screen", screenSchema);

