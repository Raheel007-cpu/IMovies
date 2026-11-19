const mongoose = require("mongoose");

const bookingSeatSchema = new mongoose.Schema(
  {
    showSeat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShowSeat",
      required: true,
    },
    seat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      required: true,
    },
    seatNumber: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: [true, "Booking number is required"],
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: [true, "Show reference is required"],
      index: true,
    },
    seats: {
      type: [bookingSeatSchema],
      required: [true, "At least one seat must be selected"],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "Booking must include at least one seat",
      },
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: 0,
    },
    convenienceFee: {
      type: Number,
      default: 30,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: [true, "Final payable amount is required"],
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["MOCK_UPI", "MOCK_CARD", "MOCK_NETBANKING"],
      default: "MOCK_UPI",
    },
    paymentTransactionId: {
      type: String,
    },
    bookingStatus: {
      type: String,
      enum: ["CONFIRMED", "CANCELLED", "EXPIRED"],
      default: "CONFIRMED",
      index: true,
    },
    cancellationReason: {
      type: String,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize booking history queries for users
bookingSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Booking", bookingSchema);

