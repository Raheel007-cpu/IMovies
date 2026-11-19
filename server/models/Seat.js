const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    screen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Screen",
      required: [true, "Screen reference is required"],
      index: true,
    },
    row: {
      type: String,
      required: [true, "Row label is required (e.g. A, B, C)"],
      trim: true,
      uppercase: true,
    },
    column: {
      type: Number,
      required: [true, "Column index is required"],
      min: 1,
    },
    seatNumber: {
      type: String,
      required: [true, "Seat number is required (e.g. A1, A2)"],
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      enum: {
        values: ["Silver", "Gold", "Platinum", "VIP"],
        message: "{VALUE} is not a valid seat category",
      },
      required: [true, "Seat category is required"],
      default: "Gold",
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: 0,
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

// Prevent duplicate seats within the same screen
seatSchema.index({ screen: 1, seatNumber: 1 }, { unique: true });
seatSchema.index({ screen: 1, row: 1, column: 1 });

module.exports = mongoose.model("Seat", seatSchema);

