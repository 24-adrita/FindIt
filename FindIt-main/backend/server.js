const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./src/config/db");
const itemRoutes = require("./src/routes/itemRoutes");
const authRoutes = require("./src/routes/authRoutes");
const claimRoutes = require("./src/routes/claimRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy for rate-limiting and client IP resolution
app.set("trust proxy", process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : 1);

// Connect to MongoDB
connectDB();

// CORS Configuration - allow frontend Next.js on port 3000
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === "development") {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation: Origin not allowed"), false);
    },
    credentials: true,
  })
);

// Body parsing middleware
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// Safely serve uploaded item images
const uploadsPath = path.resolve(__dirname, "uploads");
app.use(
  "/uploads",
  express.static(uploadsPath, {
    dotfiles: "deny",
    index: false,
    maxAge: "1d",
  })
);

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: "FindIt Backend API",
    database: {
      status: dbStatusMap[dbState] || "unknown",
      readyState: dbState,
      name: mongoose.connection.name || "findit",
    },
    version: "1.0.0 (Day 5 - Final)",
  });
});

// Mount REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/notifications", notificationRoutes);
app.get("/api/benchmark", (req, res) => res.redirect("/api/items/benchmark/summary"));

// 404 Handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled Server Error:", err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error occurred.",
  });
});

// Start Express server if run directly
let server;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`🚀 [FindIt Server] Backend running on http://localhost:${PORT}`);
    console.log(`📡 [FindIt Health] Healthcheck endpoint: http://localhost:${PORT}/api/health`);
    console.log(`📁 [FindIt Uploads] Uploads directory: ${uploadsPath}`);
  });
}

// Graceful shutdown handling
process.on("SIGINT", async () => {
  console.log("\n🛑 Gracefully shutting down FindIt backend...");
  await mongoose.connection.close();
  if (server) {
    server.close(() => {
      console.log("👋 Backend server closed.");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

module.exports = app;
