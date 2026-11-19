const { Booking, ShowSeat, Show } = require("../models");

/**
 * Generate a unique booking reference number
 * Example: IMV-20261119-X8K9P
 */
const generateBookingNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `IMV-${dateStr}-${randomStr}`;
};

/**
 * @desc    Create and confirm booking with mock payment validation
 * @route   POST /api/bookings
 * @access  Protected
 */
const createBooking = async (req, res) => {
  try {
    const { showId, seatIds, paymentMethod } = req.body;
    const userId = req.user._id;

    if (!showId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide showId and at least one seat to book",
      });
    }

    // 1. Fetch Show details
    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    // 2. Validate Seat Holds:
    // Ensure that ALL requested seats are currently held by this user and NOT expired
    const heldSeats = await ShowSeat.find({
      _id: { $in: seatIds },
      show: showId,
      status: "HELD",
      heldBy: userId,
      heldExpiresAt: { $gt: new Date() },
    });

    if (heldSeats.length !== seatIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more selected seats are no longer held or have expired. Please re-select your seats.",
      });
    }

    // 3. Backend Fare Calculation (Never trust frontend price)
    const baseTicketTotal = heldSeats.reduce((acc, seat) => acc + seat.price, 0);
    const convenienceFee = 30; // standard fee
    const taxAmount = Math.round(convenienceFee * 0.18); // 18% GST on convenience fee
    const finalAmount = baseTicketTotal + convenienceFee + taxAmount;

    // 4. Mock Payment Processor Validation
    // Keep modular for Razorpay / Stripe integration
    const allowedMethods = ["MOCK_UPI", "MOCK_CARD", "MOCK_NETBANKING"];
    const selectedMethod = allowedMethods.includes(paymentMethod)
      ? paymentMethod
      : "MOCK_UPI";

    const mockTxnId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 5. Create Booking Document
    const booking = await Booking.create({
      bookingNumber: generateBookingNumber(),
      user: userId,
      show: showId,
      seats: heldSeats.map((s) => ({
        showSeat: s._id,
        seat: s.seat,
        seatNumber: s.seatNumber,
        category: s.category,
        price: s.price,
      })),
      totalAmount: baseTicketTotal,
      convenienceFee,
      taxAmount,
      finalAmount,
      paymentStatus: "COMPLETED",
      paymentMethod: selectedMethod,
      paymentTransactionId: mockTxnId,
      bookingStatus: "CONFIRMED",
    });

    // 6. Atomically update ShowSeats to 'BOOKED' linked to this booking
    await ShowSeat.updateMany(
      { _id: { $in: seatIds }, show: showId },
      {
        $set: {
          status: "BOOKED",
          booking: booking._id,
          heldExpiresAt: null,
        },
      }
    );

    // Populate booking response with movie and theatre details
    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: "show",
        populate: [
          { path: "movie", select: "title posterUrl certificate duration" },
          { path: "theatre", select: "name address city" },
          { path: "screen", select: "screenNumber name soundSystem" },
        ],
      })
      .populate("user", "name email phone");

    res.status(201).json({
      success: true,
      message: "Ticket booking confirmed successfully",
      data: populatedBooking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process booking",
    });
  }
};

/**
 * @desc    Get booking history for the logged-in user
 * @route   GET /api/bookings/my
 * @access  Protected
 */
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: "show",
        populate: [
          { path: "movie", select: "title posterUrl certificate duration" },
          { path: "theatre", select: "name address" },
          { path: "screen", select: "name screenNumber" },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch bookings",
    });
  }
};

/**
 * @desc    Get single booking ticket details by ID
 * @route   GET /api/bookings/:id
 * @access  Protected
 */
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: "show",
        populate: [
          { path: "movie", select: "title posterUrl bannerUrl certificate duration language" },
          { path: "theatre", select: "name address city amenities" },
          { path: "screen", select: "screenNumber name soundSystem projectionType" },
        ],
      })
      .populate("user", "name email phone");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Ensure users can only view their own bookings (unless Admin)
    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this booking",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch booking details",
    });
  }
};

/**
 * @desc    Cancel booking & release seats back to available
 * @route   PATCH /api/bookings/:id/cancel
 * @access  Protected
 */
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("show");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Authorization check
    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking",
      });
    }

    if (booking.bookingStatus === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "This booking has already been cancelled",
      });
    }

    // Time validation: Cannot cancel after show has started
    if (new Date() >= new Date(booking.show.startTime)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel tickets for a show that has already started or concluded",
      });
    }

    // Update Booking status
    booking.bookingStatus = "CANCELLED";
    booking.paymentStatus = "REFUNDED";
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || "User requested cancellation";
    await booking.save();

    // Release all booked seats back to 'AVAILABLE'
    const seatIds = booking.seats.map((s) => s.showSeat);
    await ShowSeat.updateMany(
      { _id: { $in: seatIds }, show: booking.show._id },
      {
        $set: {
          status: "AVAILABLE",
          heldBy: null,
          heldExpiresAt: null,
          booking: null,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully. Seats have been returned to inventory and mock refund processed.",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel booking",
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
};

