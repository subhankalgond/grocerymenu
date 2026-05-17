// ──────────────────────────────────────────────
//  FreshCart — Order Routes (MongoDB)
// ──────────────────────────────────────────────

const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const authMiddleware = require("../middleware/auth");

// POST /api/orders — place a new order (customer)
router.post("/", async (req, res) => {
  try {
    const { items, customer, paymentMethod } = req.body;

    // Validate
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }
    if (!customer || !customer.name || !customer.phone || !customer.address) {
      return res.status(400).json({
        success: false,
        message: "Customer name, phone, and address are required",
      });
    }

    // Calculate totals
    const orderItems = items.map((item) => ({
      productId: item.productId,
      name: item.name,
      emoji: item.emoji,
      price: item.price,
      unit: item.unit,
      quantity: item.quantity,
      subtotal: +(item.price * item.quantity).toFixed(2),
    }));

    const total = +orderItems.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2);

    const order = await Order.create({
      items: orderItems,
      total,
      customer: {
        name: customer.name,
        email: customer.email || "",
        phone: customer.phone,
        address: customer.address,
      },
      paymentMethod: paymentMethod || "cod",
      status: "pending",
      isNewOrder: true,
    });

    res.status(201).json({ success: true, message: "Order placed successfully!", data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders — list all orders (admin only)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/new-count — get count of new/unread orders (admin)
router.get("/new-count", authMiddleware, async (req, res) => {
  try {
    const count = await Order.countDocuments({ isNewOrder: true });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/stats — get order statistics (admin)
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: "pending" });
    const acceptedOrders = await Order.countDocuments({ status: "accepted" });
    const deliveredOrders = await Order.countDocuments({ status: "delivered" });
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        acceptedOrders,
        deliveredOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/:id — get single order
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/orders/:id/status — update order status (admin only)
router.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "accepted", "delivered", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, isNewOrder: false },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/orders/:id/mark-read — mark order as read (admin)
router.patch("/:id/mark-read", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { isNewOrder: false },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/orders/mark-all-read — mark all orders as read (admin)
router.patch("/mark-all-read", authMiddleware, async (req, res) => {
  try {
    await Order.updateMany({ isNewOrder: true }, { isNewOrder: false });
    res.json({ success: true, message: "All orders marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
