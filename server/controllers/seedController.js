const {
  User,
  City,
  Theatre,
  Screen,
  Seat,
  Movie,
  Show,
  ShowSeat,
  Booking,
} = require("../models");

/**
 * @desc    Get counts and status of all database collections
 * @route   GET /api/seed/status
 * @access  Public
 */
const getDatabaseStats = async (req, res) => {
  try {
    const [
      userCount,
      cityCount,
      theatreCount,
      screenCount,
      seatCount,
      movieCount,
      showCount,
      showSeatCount,
      bookingCount,
    ] = await Promise.all([
      User.countDocuments(),
      City.countDocuments(),
      Theatre.countDocuments(),
      Screen.countDocuments(),
      Seat.countDocuments(),
      Movie.countDocuments(),
      Show.countDocuments(),
      ShowSeat.countDocuments(),
      Booking.countDocuments(),
    ]);

    const isSeeded = movieCount > 0 && showCount > 0 && seatCount > 0;

    res.status(200).json({
      success: true,
      message: isSeeded
        ? "Database is populated with IMovies seed data."
        : "Database is connected but has empty collections. Run 'npm run seed' to populate.",
      isSeeded,
      counts: {
        users: userCount,
        cities: cityCount,
        theatres: theatreCount,
        screens: screenCount,
        seats: seatCount,
        movies: movieCount,
        shows: showCount,
        showSeats: showSeatCount,
        bookings: bookingCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch database stats: ${error.message}`,
    });
  }
};

module.exports = {
  getDatabaseStats,
};

