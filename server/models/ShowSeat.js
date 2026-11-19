const mongoose = require("mongoose");

const showSeatSchema = new mongoose.Schema(
  {
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: [true, "Show reference is required"],
      index: true,
    },
    seat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      required: [true, "Seat reference is required"],
      index: true,
    },
    seatNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    row: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    column: {
      type: Number,
      required: true,
    },
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
    status: {
      type: String,
      enum: ["AVAILABLE", "HELD", "BOOKED"],
      default: "AVAILABLE",
      index: true,
    },
    heldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    heldExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// CRITICAL UNIQUE COMPOUND INDEX: Guarantees no duplicate seat state per show
showSeatSchema.index({ show: 1, seat: 1 }, { unique: true });

// Compound index for querying show layouts
showSeatSchema.index({ show: 1, status: 1 });
showSeatSchema.index({ show: 1, row: 1, column: 1 });

module.exports = mongoose.model("ShowSeat", showSeatSchema);

