// ──────────────────────────────────────────────
//  FreshCart — MongoDB Connection
// ──────────────────────────────────────────────

const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("  ❌  MONGODB_URI not set in .env file");
      console.error("  💡  Add MONGODB_URI=mongodb://localhost:27017/freshcart to your .env");
      process.exit(1);
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    isConnected = true;
    console.log(`  ✅  MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`  ❌  MongoDB Connection Error: ${error.message}`);
    console.error("");
    console.error("  ╔══════════════════════════════════════════════╗");
    console.error("  ║         HOW TO FIX THIS                     ║");
    console.error("  ╠══════════════════════════════════════════════╣");
    console.error("  ║                                              ║");
    console.error("  ║  Option 1: Install MongoDB locally           ║");
    console.error("  ║    https://www.mongodb.com/try/download      ║");
    console.error("  ║                                              ║");
    console.error("  ║  Option 2: Use MongoDB Atlas (FREE cloud)    ║");
    console.error("  ║    1. Go to https://cloud.mongodb.com        ║");
    console.error("  ║    2. Create a free cluster                  ║");
    console.error("  ║    3. Get your connection string              ║");
    console.error("  ║    4. Update MONGODB_URI in .env             ║");
    console.error("  ║                                              ║");
    console.error("  ╚══════════════════════════════════════════════╝");
    process.exit(1);
  }
};

module.exports = connectDB;
