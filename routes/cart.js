// ──────────────────────────────────────────────
//  FreshCart — Cart Routes
//  Agent 2: Backend Engineer
// ──────────────────────────────────────────────

const express = require("express");
const router = express.Router();
const store = require("../data/store");

// GET /api/cart — get current cart with computed totals
router.get("/", (req, res) => {
  const items = store.cart.items.map((item) => ({
    ...item,
    subtotal: +(item.product.price * item.quantity).toFixed(2),
  }));

  const total = +items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  res.json({ success: true, data: { items, total, count } });
});

// POST /api/cart — add item to cart { productId, quantity? }
router.post("/", (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({ success: false, message: "productId is required" });
  }

  const product = store.products.find((p) => p.id === parseInt(productId));
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  if (!product.inStock) {
    return res.status(400).json({ success: false, message: "Product is out of stock" });
  }

  const existing = store.cart.items.find((i) => i.productId === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    store.cart.items.push({ productId: product.id, quantity, product });
  }

  res.json({ success: true, message: "Item added to cart", data: store.cart });
});

// PUT /api/cart/:productId — update quantity { quantity }
router.put("/:productId", (req, res) => {
  const pid = parseInt(req.params.productId);
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ success: false, message: "quantity must be >= 1" });
  }

  const item = store.cart.items.find((i) => i.productId === pid);
  if (!item) {
    return res.status(404).json({ success: false, message: "Item not in cart" });
  }

  item.quantity = quantity;
  res.json({ success: true, message: "Quantity updated", data: store.cart });
});

// DELETE /api/cart/:productId — remove item from cart
router.delete("/:productId", (req, res) => {
  const pid = parseInt(req.params.productId);
  const index = store.cart.items.findIndex((i) => i.productId === pid);

  if (index === -1) {
    return res.status(404).json({ success: false, message: "Item not in cart" });
  }

  store.cart.items.splice(index, 1);
  res.json({ success: true, message: "Item removed from cart" });
});

// DELETE /api/cart — clear entire cart
router.delete("/", (req, res) => {
  store.cart.items = [];
  res.json({ success: true, message: "Cart cleared" });
});

module.exports = router;
