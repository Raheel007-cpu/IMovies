const { Show, ShowSeat, Seat } = require("../models");

/**
 * Helper: Lazy cleanup of expired seat holds for a show
 * Stateless & serverless compatible
 */
const cleanupExpiredHolds = async (showId) => {
  try {
    await ShowSeat.updateMany(
      {
        show: showId,
        status: "HELD",
        heldExpiresAt: { $lt: new Date() },
      },
      {
        $set: {
          status: "AVAILABLE",
          heldBy: null,
          heldExpiresAt: null,
        },
      }
    );
  } catch (err) {
    console.error("Lazy hold cleanup notice:", err.message);
  }
};

/**
 * @desc    Get dynamic seat layout & real-time availability for a show
 * @route   GET /api/shows/:showId/seats
 * @access  Public
 */
const getShowSeatLayout = async (req, res) => {
  try {
    const { showId } = req.params;

    // Run lazy cleanup for this show first
    await cleanupExpiredHolds(showId);

    // Fetch show metadata
    const show = await Show.findById(showId)
      .populate("movie", "title certificate duration posterUrl")
      .populate({
        path: "theatre",
        select: "name address city",
        populate: { path: "city", select: "name" },
      })
      .populate("screen", "screenNumber name soundSystem projectionType totalSeats");

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    // Fetch all ShowSeats for this show sorted by row and column
    const showSeats = await ShowSeat.find({ show: showId }).sort({
      row: 1,
      column: 1,
    });

    // Check optional authenticated user ID from Bearer token
    let currentUserId = null;
    if (req.user) {
      currentUserId = req.user._id.toString();
    }

    // Group seats by Category and Row for cinema-standard layout
    const categoryOrder = ["Platinum", "Gold", "Silver", "VIP"];
    const groupedByCategory = {};

    let availableCount = 0;
    let bookedCount = 0;
    let heldCount = 0;

    for (const seat of showSeats) {
      const cat = seat.category || "Standard";
      if (!groupedByCategory[cat]) {
        // Find tier price from Show.pricing
        const pricingObj = show.pricing?.find((p) => p.category === cat);
        groupedByCategory[cat] = {
          category: cat,
          price: pricingObj ? pricingObj.price : seat.price,
          rows: {},
        };
      }

      if (!groupedByCategory[cat].rows[seat.row]) {
        groupedByCategory[cat].rows[seat.row] = [];
      }

      const isHeldByMe =
        currentUserId &&
        seat.status === "HELD" &&
        seat.heldBy &&
        seat.heldBy.toString() === currentUserId;

      if (seat.status === "AVAILABLE") {
        availableCount++;
      } else if (seat.status === "BOOKED") {
        bookedCount++;
      } else if (seat.status === "HELD") {
        heldCount++;
      }

      groupedByCategory[cat].rows[seat.row].push({
        _id: seat._id,
        seat: seat.seat,
        seatNumber: seat.seatNumber,
        row: seat.row,
        column: seat.column,
        category: seat.category,
        price: seat.price,
        status: seat.status,
        isHeldByMe: Boolean(isHeldByMe),
        heldExpiresAt: seat.heldExpiresAt,
      });
    }

    // Format into ordered array
    const layout = Object.keys(groupedByCategory)
      .sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b))
      .map((catKey) => {
        const catData = groupedByCategory[catKey];
        return {
          category: catData.category,
          price: catData.price,
          rows: Object.keys(catData.rows)
            .sort()
            .map((rowKey) => ({
              row: rowKey,
              seats: catData.rows[rowKey],
            })),
        };
      });

    res.status(200).json({
      success: true,
      data: {
        show,
        totalSeats: showSeats.length,
        availableCount,
        bookedCount,
        heldCount,
        layout,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch seat layout",
    });
  }
};

/**
 * @desc    Temporarily hold seats with 10-minute expiration (Atomic Concurrency Safe)
 * @route   POST /api/shows/:showId/hold
 * @access  Protected
 */
const holdSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const { seatIds } = req.body; // Array of ShowSeat _ids

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one seat to hold",
      });
    }

    if (seatIds.length > 10) {
      return res.status(400).json({
        success: false,
        message: "You can hold a maximum of 10 seats per transaction",
      });
    }

    // Run lazy cleanup first
    await cleanupExpiredHolds(showId);

    const userId = req.user._id;
    const HOLD_DURATION_MS = 10 * 60 * 1000; // 10 minutes
    const expiresAt = new Date(Date.now() + HOLD_DURATION_MS);

    const successfullyHeld = [];

    // Attempt atomic lock for each seat individually
    for (const seatId of seatIds) {
      const heldSeat = await ShowSeat.findOneAndUpdate(
        {
          _id: seatId,
          show: showId,
          $or: [
            { status: "AVAILABLE" },
            { status: "HELD", heldExpiresAt: { $lt: new Date() } },
            { status: "HELD", heldBy: userId },
          ],
        },
        {
          $set: {
            status: "HELD",
            heldBy: userId,
            heldExpiresAt: expiresAt,
          },
        },
        { new: true }
      );

      if (!heldSeat) {
        // Concurrency conflict detected: Roll back any seats held in this batch
        if (successfullyHeld.length > 0) {
          const rollbackIds = successfullyHeld.map((s) => s._id);
          await ShowSeat.updateMany(
            { _id: { $in: rollbackIds }, show: showId, heldBy: userId },
            {
              $set: {
                status: "AVAILABLE",
                heldBy: null,
                heldExpiresAt: null,
              },
            }
          );
        }

        // Fetch seat details for descriptive error message
        const conflictSeat = await ShowSeat.findById(seatId);
        const seatLabel = conflictSeat ? conflictSeat.seatNumber : "one of your selected seats";

        return res.status(409).json({
          success: false,
          message: `Seat ${seatLabel} is no longer available. Another customer just reserved or held it.`,
        });
      }

      successfullyHeld.push(heldSeat);
    }

    // Calculate total amount on backend
    const totalAmount = successfullyHeld.reduce((acc, curr) => acc + curr.price, 0);

    res.status(200).json({
      success: true,
      message: `${successfullyHeld.length} seat(s) held successfully for 10 minutes`,
      data: {
        showId,
        heldSeats: successfullyHeld.map((s) => ({
          showSeatId: s._id,
          seatId: s.seat,
          seatNumber: s.seatNumber,
          category: s.category,
          price: s.price,
        })),
        totalAmount,
        expiresAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to acquire seat hold",
    });
  }
};

/**
 * @desc    Release seats previously held by the authenticated user
 * @route   POST /api/shows/:showId/release
 * @access  Protected
 */
const releaseSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const { seatIds } = req.body;

    const query = {
      show: showId,
      heldBy: req.user._id,
      status: "HELD",
    };

    if (Array.isArray(seatIds) && seatIds.length > 0) {
      query._id = { $in: seatIds };
    }

    const result = await ShowSeat.updateMany(query, {
      $set: {
        status: "AVAILABLE",
        heldBy: null,
        heldExpiresAt: null,
      },
    });

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} seat hold(s) released successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to release seats",
    });
  }
};

module.exports = {
  getShowSeatLayout,
  holdSeats,
  releaseSeats,
};

