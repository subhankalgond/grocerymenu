/* ─────────────────────────────────────────────
   FreshCart — localStorage-based API layer
   (Static version for GitHub Pages — no backend)
   ───────────────────────────────────────────── */

const API = {
  /* ── helpers ─────────────────────────────── */
  _cartKey: "freshcart_cart",
  _ordersKey: "freshcart_orders",
  _orderIdKey: "freshcart_nextOrderId",

  _getCart()   { return JSON.parse(localStorage.getItem(this._cartKey) || '{"items":[]}'); },
  _saveCart(c) { localStorage.setItem(this._cartKey, JSON.stringify(c)); },

  _getOrders()   { return JSON.parse(localStorage.getItem(this._ordersKey) || "[]"); },
  _saveOrders(o) { localStorage.setItem(this._ordersKey, JSON.stringify(o)); },

  _nextOrderId() {
    let id = parseInt(localStorage.getItem(this._orderIdKey) || "1001");
    localStorage.setItem(this._orderIdKey, String(id + 1));
    return id;
  },

  /* ── Products (from embedded PRODUCTS array) ── */
  async getProducts(category = "All", search = "") {
    let result = [...PRODUCTS];
    if (category && category !== "All") {
      result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return { success: true, data: result, total: result.length };
  },

  async getCategories() {
    return { success: true, data: CATEGORIES };
  },

  /* ── Cart (localStorage) ─────────────────── */
  async getCart() {
    const cart = this._getCart();
    const items = cart.items.map(item => ({
      ...item,
      subtotal: +(item.product.price * item.quantity).toFixed(2),
    }));
    const total = +items.reduce((s, i) => s + i.subtotal, 0).toFixed(2);
    const count = items.reduce((s, i) => s + i.quantity, 0);
    return { success: true, data: { items, total, count } };
  },

  async addToCart(productId, quantity = 1) {
    const product = PRODUCTS.find(p => p.id === parseInt(productId));
    if (!product) throw new Error("Product not found");
    if (!product.inStock) throw new Error("Product is out of stock");

    const cart = this._getCart();
    const existing = cart.items.find(i => i.productId === product.id);
    if (existing) { existing.quantity += quantity; }
    else { cart.items.push({ productId: product.id, quantity, product }); }
    this._saveCart(cart);
    return { success: true, message: "Item added to cart", data: cart };
  },

  async updateCartItem(productId, quantity) {
    const cart = this._getCart();
    const item = cart.items.find(i => i.productId === parseInt(productId));
    if (!item) throw new Error("Item not in cart");
    item.quantity = quantity;
    this._saveCart(cart);
    return { success: true, message: "Quantity updated", data: cart };
  },

  async removeFromCart(productId) {
    const cart = this._getCart();
    cart.items = cart.items.filter(i => i.productId !== parseInt(productId));
    this._saveCart(cart);
    return { success: true, message: "Item removed from cart" };
  },

  async clearCart() {
    this._saveCart({ items: [] });
    return { success: true, message: "Cart cleared" };
  },

  /* ── Orders (localStorage) ──────────────── */
  async placeOrder(customer) {
    const cart = this._getCart();
    if (cart.items.length === 0) throw new Error("Cart is empty");
    if (!customer.name || !customer.email || !customer.address) {
      throw new Error("name, email, and address are required");
    }

    const items = cart.items.map(item => ({
      productId: item.productId,
      name: item.product.name,
      emoji: item.product.emoji,
      price: item.product.price,
      unit: item.product.unit,
      quantity: item.quantity,
      subtotal: +(item.product.price * item.quantity).toFixed(2),
    }));
    const total = +items.reduce((s, i) => s + i.subtotal, 0).toFixed(2);

    const order = {
      id: this._nextOrderId(),
      items, total,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      customer: { name: customer.name, email: customer.email, phone: customer.phone || "", address: customer.address },
    };

    const orders = this._getOrders();
    orders.push(order);
    this._saveOrders(orders);
    this._saveCart({ items: [] });
    return { success: true, message: "Order placed!", data: order };
  },

  async getOrders() {
    const orders = this._getOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { success: true, data: orders };
  },
};
