// ──────────────────────────────────────────────
//  FreshCart — Express Server
//  Agent 2: Backend Engineer
// ──────────────────────────────────────────────

const express = require("express");
const cors = require("cors");
const path = require("path");

const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────
app.use(cors());
app.use(express.json());

// Serve the frontend
app.use(express.static(path.join(__dirname, "public")));

// ── API Routes ─────────────────────────────
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// ── Health check ───────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ── Fallback to index.html (SPA-style) ────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Start ──────────────────────────────────
app.listen(PORT, () => {
  console.log();
  console.log("  🛒  FreshCart is running!");
  console.log(`  ➜  Local:  http://localhost:${PORT}`);
  console.log();
});
