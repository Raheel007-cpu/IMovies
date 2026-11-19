const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const healthRoutes = require("./routes/healthRoutes");
const seedRoutes = require("./routes/seedRoutes");
const authRoutes = require("./routes/authRoutes");
const movieRoutes = require("./routes/movieRoutes");
const cityRoutes = require("./routes/cityRoutes");
const theatreRoutes = require("./routes/theatreRoutes");
const showRoutes = require("./routes/showRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { securityHeaders, sanitizeNoSQL } = require("./middleware/securityMiddleware");
const { apiLimiter } = require("./middleware/rateLimiter");

dotenv.config();

const app = express();

// Security Headers (MIME sniffing, clickjacking, HSTS)
app.use(securityHeaders);

// Ensure DB connection for incoming requests (Warm connection reuse)
app.use(async (req, res, next) => {
  try {
    if (process.env.MONGO_URI) {
      await connectDB();
    }
  } catch (err) {
    console.error("Database connection warning on request:", err.message);
  }
  next();
});

// Configure CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, same-origin)
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev, can restrict in production
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// NoSQL Injection Sanitizer
app.use(sanitizeNoSQL);

// General API Rate Limiting
app.use("/api", apiLimiter);

// Root Welcome Route
app.get("/", (req, res) => {
  res.status(200).json({
    name: "IMovies Backend API Server",
    tagline: "Movie ticket booking made simple.",
    message: "The React frontend is running on http://localhost:5173. For API documentation, check /api or /api/health.",
    endpoints: {
      api: "/api",
      health: "/api/health",
      seedStatus: "/api/seed/status",
    },
  });
});

// Root API Welcome Route
app.get("/api", (req, res) => {
  res.status(200).json({
    name: "IMovies API",
    tagline: "Movie ticket booking made simple.",
    version: "1.0.0",
    docs: "/api/health",
  });
});

// Register API Routes
app.use("/api/health", healthRoutes);
app.use("/api/seed", seedRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api/theatres", theatreRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;

