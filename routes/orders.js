// ──────────────────────────────────────────────
//  FreshCart — Order Routes
//  Agent 2: Backend Engineer
// ──────────────────────────────────────────────

const express = require("express");
const router = express.Router();
const store = require("../data/store");

// POST /api/orders — place an order from current cart
router.post("/", (req, res) => {
  if (store.cart.items.length === 0) {
    return res.status(400).json({ success: false, message: "Cart is empty" });
  }

  const { name, email, phone, address } = req.body;

  if (!name || !email || !address) {
    return res.status(400).json({
      success: false,
      message: "name, email, and address are required",
    });
  }

  const items = store.cart.items.map((item) => ({
    productId: item.productId,
    name: item.product.name,
    emoji: item.product.emoji,
    price: item.product.price,
    unit: item.product.unit,
    quantity: item.quantity,
    subtotal: +(item.product.price * item.quantity).toFixed(2),
  }));

  const total = +items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2);

  const order = {
    id: store.getNextOrderId(),
    items,
    total,
    status: "confirmed",
    createdAt: new Date().toISOString(),
    customer: { name, email, phone: phone || "", address },
  };

  store.orders.push(order);
  store.cart.items = []; // clear cart after placing order

  res.status(201).json({ success: true, message: "Order placed!", data: order });
});

// GET /api/orders — list all orders
router.get("/", (req, res) => {
  res.json({
    success: true,
    data: store.orders.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    ),
  });
});

// GET /api/orders/:id — get one order
router.get("/:id", (req, res) => {
  const order = store.orders.find((o) => o.id === parseInt(req.params.id));
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  res.json({ success: true, data: order });
});

module.exports = router;
