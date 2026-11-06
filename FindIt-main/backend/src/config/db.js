const mongoose = require("mongoose");

/**
 * Connect to MongoDB with sensible timeouts and retry options.
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/findit";
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if server cannot be reached
    });

    console.log(`✅ [MongoDB] Connected successfully to host: ${conn.connection.host}`);
    console.log(`📦 [MongoDB] Database name: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ [MongoDB] Connection error: ${error.message}`);
    console.error(
      "💡 Troubleshooting: Ensure your local MongoDB service is running (or check your MONGODB_URI in backend/.env)."
    );
    // Don't kill process immediately so server can still serve health status/clear errors
    return null;
  }
};

module.exports = connectDB;
