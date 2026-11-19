const mongoose = require("mongoose");

/**
 * @desc    API Health Check & Status
 * @route   GET /api/health
 * @access  Public
 */
const getHealthStatus = async (req, res) => {
  const dbStateMap = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
  };

  const dbStatus = dbStateMap[mongoose.connection.readyState] || "Unknown";

  res.status(200).json({
    success: true,
    message: "IMovies API is healthy and operational.",
    app: "IMovies - Movie Ticket Booking Platform",
    tagline: "Movie ticket booking made simple.",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: {
      status: dbStatus,
      connected: mongoose.connection.readyState === 1,
    },
  });
};

/**
 * @desc    Test Ping Route
 * @route   GET /api/health/ping
 * @access  Public
 */
const pingServer = (req, res) => {
  res.status(200).json({
    success: true,
    message: "pong",
    serverTime: new Date().toISOString(),
  });
};

module.exports = {
  getHealthStatus,
  pingServer,
};

