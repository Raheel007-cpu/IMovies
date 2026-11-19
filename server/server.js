const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas (if MONGO_URI is set)
connectDB().catch((err) => {
  console.warn("MongoDB startup notice:", err.message);
});

const server = app.listen(PORT, () => {
  console.log(`🚀 IMovies Local Server running on http://localhost:${PORT}`);
  console.log(`📡 Health endpoint: http://localhost:${PORT}/api/health`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Error: ${err.message}`);
  server.close(() => process.exit(1));
});

