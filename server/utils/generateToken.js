const jwt = require("jsonwebtoken");

/**
 * Generate a signed JWT token
 * @param {string} id - User ObjectId
 * @param {string} role - User role (user | admin)
 * @returns {string} Signed JWT
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "imovies_fallback_secret", {
    expiresIn: "30d",
  });
};

module.exports = generateToken;

