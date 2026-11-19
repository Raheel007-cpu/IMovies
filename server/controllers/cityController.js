const { City } = require("../models");

/**
 * @desc    Get all active cities
 * @route   GET /api/cities
 * @access  Public
 */
const getCities = async (req, res) => {
  try {
    const cities = await City.find({ isActive: true }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: cities.length,
      data: cities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch cities",
    });
  }
};

/**
 * @desc    Create a new city (Admin only)
 * @route   POST /api/cities
 * @access  Admin Protected
 */
const createCity = async (req, res) => {
  try {
    const { name, state } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "City name is required",
      });
    }

    const cityExists = await City.findOne({ name: name.trim() });
    if (cityExists) {
      return res.status(400).json({
        success: false,
        message: "City already exists",
      });
    }

    const city = await City.create({
      name: name.trim(),
      state: state ? state.trim() : "",
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "City created successfully",
      data: city,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create city",
    });
  }
};

module.exports = {
  getCities,
  createCity,
};

