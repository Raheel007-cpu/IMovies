const { Theatre, Screen, City } = require("../models");

/**
 * @desc    Get all theatres with optional city filter
 * @route   GET /api/theatres
 * @access  Public
 */
const getTheatres = async (req, res) => {
  try {
    const { city } = req.query;
    const query = { isActive: true };

    if (city) {
      // Find city by name or ObjectId
      let cityDoc = null;
      if (city.match(/^[0-9a-fA-F]{24}$/)) {
        cityDoc = await City.findById(city);
      } else {
        cityDoc = await City.findOne({ name: new RegExp(`^${city.trim()}$`, "i") });
      }

      if (cityDoc) {
        query.city = cityDoc._id;
      }
    }

    const theatres = await Theatre.find(query)
      .populate("city", "name state")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: theatres.length,
      data: theatres,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch theatres",
    });
  }
};

/**
 * @desc    Get single theatre details with screens
 * @route   GET /api/theatres/:id
 * @access  Public
 */
const getTheatreById = async (req, res) => {
  try {
    const theatre = await Theatre.findById(req.params.id).populate("city", "name state");

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    // Fetch screens for this theatre
    const screens = await Screen.find({ theatre: theatre._id, isActive: true });

    res.status(200).json({
      success: true,
      data: {
        ...theatre.toObject(),
        screens,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch theatre",
    });
  }
};

/**
 * @desc    Create new theatre (Admin only)
 * @route   POST /api/theatres
 * @access  Admin Protected
 */
const createTheatre = async (req, res) => {
  try {
    const { name, city, address, amenities } = req.body;

    if (!name || !city || !address) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, city, and address",
      });
    }

    const theatre = await Theatre.create({
      name: name.trim(),
      city,
      address: address.trim(),
      amenities: Array.isArray(amenities) ? amenities : amenities ? amenities.split(",").map((a) => a.trim()) : [],
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Theatre created successfully",
      data: theatre,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create theatre",
    });
  }
};

/**
 * @desc    Update theatre details (Admin only)
 * @route   PUT /api/theatres/:id
 * @access  Admin Protected
 */
const updateTheatre = async (req, res) => {
  try {
    let theatre = await Theatre.findById(req.params.id);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    theatre = await Theatre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Theatre updated successfully",
      data: theatre,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update theatre",
    });
  }
};

module.exports = {
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
};

