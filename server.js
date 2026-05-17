// ──────────────────────────────────────────────
//  FreshCart — Express Server with MongoDB
// ──────────────────────────────────────────────

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────
app.use(cors());
app.use(express.json());

// Serve the frontend (public folder)
app.use(express.static(path.join(__dirname, "public")));

// ── API Routes ─────────────────────────────
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);

// ── Health check ───────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ── Serve admin dashboard ──────────────────
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ── Fallback to index.html (SPA-style) ────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Connect to MongoDB & Start ─────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log();
    console.log("  🛒  FreshCart is running!");
    console.log(`  ➜  Customer:  http://localhost:${PORT}`);
    console.log(`  ➜  Admin:     http://localhost:${PORT}/admin`);
    console.log();
  });
});
