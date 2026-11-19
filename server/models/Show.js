const mongoose = require("mongoose");

const showPricingSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["Silver", "Gold", "Platinum", "VIP"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: [true, "Movie reference is required"],
      index: true,
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theatre",
      required: [true, "Theatre reference is required"],
      index: true,
    },
    screen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Screen",
      required: [true, "Screen reference is required"],
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, "Show start time is required"],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, "Show end time is required"],
    },
    pricing: {
      type: [showPricingSchema],
      required: [true, "Show pricing structure is required"],
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

// Indexes for fast querying by date, movie, theatre, and screen conflict detection
showSchema.index({ screen: 1, startTime: 1 });
showSchema.index({ movie: 1, startTime: 1 });
showSchema.index({ theatre: 1, startTime: 1 });

module.exports = mongoose.model("Show", showSchema);

