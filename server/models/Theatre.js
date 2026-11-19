const mongoose = require("mongoose");

const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Theatre name is required"],
      trim: true,
    },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: [true, "City is required"],
      index: true,
    },
    address: {
      type: String,
      required: [true, "Theatre address is required"],
      trim: true,
    },
    amenities: {
      type: [String],
      default: ["Dolby Atmos", "Food & Beverages", "Parking"],
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

module.exports = mongoose.model("Theatre", theatreSchema);

