const {
  Booking,
  Movie,
  Theatre,
  Screen,
  Show,
  User,
  Seat,
} = require("../models");

/**
 * @desc    Get dashboard metrics & analytics for Admin
 * @route   GET /api/admin/stats
 * @access  Admin Protected
 */
const getAdminStats = async (req, res) => {
  try {
    // 1. Calculate Total Revenue & Confirmed Bookings count
    const revenueAgg = await Booking.aggregate([
      { $match: { bookingStatus: "CONFIRMED" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$finalAmount" },
          totalConfirmed: { $sum: 1 },
          totalTicketsSold: { $sum: { $size: "$seats" } },
        },
      },
    ]);

    const stats = revenueAgg[0] || {
      totalRevenue: 0,
      totalConfirmed: 0,
      totalTicketsSold: 0,
    };

    // 2. Parallel counts across platform collections
    const [
      totalMovies,
      nowShowingMovies,
      totalTheatres,
      totalScreens,
      totalShows,
      totalUsers,
      totalCancelled,
    ] = await Promise.all([
      Movie.countDocuments(),
      Movie.countDocuments({ status: "NOW_SHOWING" }),
      Theatre.countDocuments({ isActive: true }),
      Screen.countDocuments({ isActive: true }),
      Show.countDocuments({ isActive: true }),
      User.countDocuments({ role: "user" }),
      Booking.countDocuments({ bookingStatus: "CANCELLED" }),
    ]);

    // 3. Fetch recent bookings (last 10 transactions)
    const recentBookings = await Booking.find()
      .populate("user", "name email phone")
      .populate({
        path: "show",
        populate: [
          { path: "movie", select: "title posterUrl certificate" },
          { path: "theatre", select: "name" },
          { path: "screen", select: "name screenNumber" },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          revenue: stats.totalRevenue,
          confirmedBookings: stats.totalConfirmed,
          cancelledBookings: totalCancelled,
          ticketsSold: stats.totalTicketsSold,
          totalMovies,
          nowShowingMovies,
          totalTheatres,
          totalScreens,
          totalShows,
          totalUsers,
        },
        recentBookings,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to load admin stats",
    });
  }
};

/**
 * @desc    Get all bookings across the platform with pagination & filter
 * @route   GET /api/admin/bookings
 * @access  Admin Protected
 */
const getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== "ALL") {
      query.bookingStatus = status.toUpperCase();
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("user", "name email phone")
        .populate({
          path: "show",
          populate: [
            { path: "movie", select: "title posterUrl" },
            { path: "theatre", select: "name city" },
            { path: "screen", select: "name screenNumber" },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch platform bookings",
    });
  }
};

/**
 * @desc    Create a new Screen for a Theatre and auto-generate Master Seats
 * @route   POST /api/admin/theatres/:theatreId/screens
 * @access  Admin Protected
 */
const createScreenWithSeats = async (req, res) => {
  try {
    const { theatreId } = req.params;
    const { screenNumber, name, soundSystem, projectionType } = req.body;

    if (!screenNumber) {
      return res.status(400).json({
        success: false,
        message: "Screen number is required",
      });
    }

    const screen = await Screen.create({
      theatre: theatreId,
      screenNumber,
      name: name || `Audi ${screenNumber}`,
      soundSystem: soundSystem || "Dolby Atmos 7.1",
      projectionType: projectionType || "4K Laser Digital",
      totalSeats: 30,
      isActive: true,
    });

    // Generate physical seats (Rows A: Silver, B: Gold, C: Platinum, 10 seats each)
    const tiers = [
      { row: "A", category: "Silver", basePrice: 200 },
      { row: "B", category: "Gold", basePrice: 280 },
      { row: "C", category: "Platinum", basePrice: 400 },
    ];

    const seatsToCreate = [];
    for (const t of tiers) {
      for (let c = 1; c <= 10; c++) {
        seatsToCreate.push({
          screen: screen._id,
          row: t.row,
          column: c,
          seatNumber: `${t.row}${c}`,
          category: t.category,
          basePrice: t.basePrice,
          isActive: true,
        });
      }
    }

    await Seat.insertMany(seatsToCreate);

    res.status(201).json({
      success: true,
      message: `Screen created with ${seatsToCreate.length} master seats generated`,
      data: screen,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create screen",
    });
  }
};

module.exports = {
  getAdminStats,
  getAllBookings,
  createScreenWithSeats,
};

