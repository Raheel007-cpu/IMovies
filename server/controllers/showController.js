const { Show, ShowSeat, Seat, Screen, Theatre, City } = require("../models");

/**
 * @desc    Get shows filtered by movie, date, city, or theatre
 * @route   GET /api/shows
 * @access  Public
 */
const getShows = async (req, res) => {
  try {
    const { movieId, city, theatreId, date } = req.query;

    const query = { isActive: true };

    if (movieId) {
      query.movie = movieId;
    }

    if (theatreId) {
      query.theatre = theatreId;
    }

    // Filter by city (resolve city first to get matching theatres)
    if (city && !theatreId) {
      let cityDoc = null;
      if (city.match(/^[0-9a-fA-F]{24}$/)) {
        cityDoc = await City.findById(city);
      } else {
        cityDoc = await City.findOne({ name: new RegExp(`^${city.trim()}$`, "i") });
      }

      if (cityDoc) {
        const theatresInCity = await Theatre.find({ city: cityDoc._id }).select("_id");
        const theatreIds = theatresInCity.map((t) => t._id);
        query.theatre = { $in: theatreIds };
      }
    }

    // Filter by date (from 00:00:00 to 23:59:59 of that local day)
    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const shows = await Show.find(query)
      .populate("movie", "title duration certificate posterUrl")
      .populate("theatre", "name address amenities city")
      .populate("screen", "screenNumber name soundSystem projectionType")
      .sort({ startTime: 1 });

    // Group shows by Theatre for easy frontend grouping
    const groupedMap = new Map();

    for (const show of shows) {
      if (!show.theatre) continue;

      const theatreIdStr = show.theatre._id.toString();
      if (!groupedMap.has(theatreIdStr)) {
        groupedMap.set(theatreIdStr, {
          theatre: show.theatre,
          shows: [],
        });
      }

      groupedMap.get(theatreIdStr).shows.push({
        _id: show._id,
        startTime: show.startTime,
        endTime: show.endTime,
        pricing: show.pricing,
        screen: show.screen,
      });
    }

    const groupedByTheatre = Array.from(groupedMap.values());

    res.status(200).json({
      success: true,
      count: shows.length,
      groupedCount: groupedByTheatre.length,
      groupedByTheatre,
      data: shows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch shows",
    });
  }
};

/**
 * @desc    Get single show details
 * @route   GET /api/shows/:id
 * @access  Public
 */
const getShowById = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate("movie")
      .populate({
        path: "theatre",
        populate: { path: "city", select: "name" },
      })
      .populate("screen");

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    res.status(200).json({
      success: true,
      data: show,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch show",
    });
  }
};

/**
 * @desc    Create new show & populate ShowSeats (Admin only)
 * @route   POST /api/shows
 * @access  Admin Protected
 */
const createShow = async (req, res) => {
  try {
    const { movie, theatre, screen, startTime, endTime, pricing } = req.body;

    if (!movie || !theatre || !screen || !startTime || !endTime || !pricing) {
      return res.status(400).json({
        success: false,
        message: "Please provide movie, theatre, screen, startTime, endTime, and pricing",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "Show start time must be before end time",
      });
    }

    // Overlap validation: Ensure screen is not booked at the same time
    const overlappingShow = await Show.findOne({
      screen,
      isActive: true,
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } },
      ],
    });

    if (overlappingShow) {
      return res.status(400).json({
        success: false,
        message: "This screen already has another show scheduled during this time slot",
      });
    }

    // Create the Show
    const show = await Show.create({
      movie,
      theatre,
      screen,
      startTime: start,
      endTime: end,
      pricing,
      isActive: true,
    });

    // Populate ShowSeats for each physical seat in this screen
    const physicalSeats = await Seat.find({ screen, isActive: true });
    const showSeats = physicalSeats.map((seat) => {
      const priceObj = pricing.find((p) => p.category === seat.category) || { price: seat.basePrice };
      return {
        show: show._id,
        seat: seat._id,
        seatNumber: seat.seatNumber,
        row: seat.row,
        column: seat.column,
        category: seat.category,
        price: priceObj.price,
        status: "AVAILABLE",
      };
    });

    if (showSeats.length > 0) {
      await ShowSeat.insertMany(showSeats);
    }

    res.status(201).json({
      success: true,
      message: `Show scheduled successfully with ${showSeats.length} seats generated`,
      data: show,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to schedule show",
    });
  }
};

module.exports = {
  getShows,
  getShowById,
  createShow,
};

