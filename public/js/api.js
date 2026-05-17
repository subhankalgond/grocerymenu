/* ─────────────────────────────────────────────
   FreshCart — API Layer
   Connects to Express + MongoDB backend
   Cart uses localStorage for persistence
   ───────────────────────────────────────────── */

const API = {
  BASE: "",

  /* ── Helper: fetch wrapper ────────────────── */
  async _fetch(url, options = {}) {
    try {
      const res = await fetch(this.BASE + url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      return data;
    } catch (error) {
      throw error;
    }
  },

  /* ── Products (from MongoDB via API) ──────── */
  async getProducts(category = "All", search = "") {
    let url = "/api/products?";
    if (category && category !== "All") url += `category=${encodeURIComponent(category)}&`;
    if (search) url += `search=${encodeURIComponent(search)}`;
    return this._fetch(url);
  },

  async getCategories() {
    return this._fetch("/api/products/categories");
  },

  /* ── Cart (localStorage for persistence) ──── */
  _cartKey: "freshcart_cart",

  _getCartData() {
    return JSON.parse(localStorage.getItem(this._cartKey) || '{"items":[]}');
  },

  _saveCartData(cart) {
    localStorage.setItem(this._cartKey, JSON.stringify(cart));
  },

  async getCart() {
    const cart = this._getCartData();
    const items = cart.items.map((item) => ({
      ...item,
      subtotal: +(item.price * item.quantity).toFixed(2),
    }));
    const total = +items.reduce((s, i) => s + i.subtotal, 0).toFixed(2);
    const count = items.reduce((s, i) => s + i.quantity, 0);
    return { success: true, data: { items, total, count } };
  },

  async addToCart(product) {
    const cart = this._getCartData();
    const existing = cart.items.find((i) => i.productId === product._id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.items.push({
        productId: product._id,
        name: product.name,
        emoji: product.emoji,
        price: product.price,
        unit: product.unit,
        quantity: 1,
      });
    }
    this._saveCartData(cart);
    return { success: true, message: "Item added to cart" };
  },

  async updateCartQty(productId, quantity) {
    const cart = this._getCartData();
    const item = cart.items.find((i) => i.productId === productId);
    if (!item) throw new Error("Item not in cart");
    if (quantity < 1) {
      cart.items = cart.items.filter((i) => i.productId !== productId);
    } else {
      item.quantity = quantity;
    }
    this._saveCartData(cart);
    return { success: true, message: "Cart updated" };
  },

  async removeFromCart(productId) {
    const cart = this._getCartData();
    cart.items = cart.items.filter((i) => i.productId !== productId);
    this._saveCartData(cart);
    return { success: true, message: "Item removed" };
  },

  async clearCart() {
    this._saveCartData({ items: [] });
    return { success: true, message: "Cart cleared" };
  },

  /* ── Orders (via API to MongoDB) ──────────── */
  async placeOrder(customer, paymentMethod) {
    const cart = this._getCartData();
    if (cart.items.length === 0) throw new Error("Cart is empty");

    const result = await this._fetch("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        items: cart.items,
        customer,
        paymentMethod,
      }),
    });

    // Clear cart after successful order
    this._saveCartData({ items: [] });
    return result;
  },

  /* ── WhatsApp Message Generator ────────────── */
  generateWhatsAppMessage(cart, customer = null) {
    let msg = "🛒 *FreshCart Order*\n\n";
    msg += "━━━━━━━━━━━━━━━━━\n";

    cart.items.forEach((item) => {
      msg += `${item.emoji} ${item.name}\n`;
      msg += `   ₹${item.price} × ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}\n`;
    });

    msg += "━━━━━━━━━━━━━━━━━\n";
    msg += `💰 *Total: ₹${cart.total.toFixed(2)}*\n\n`;

    if (customer) {
      msg += "👤 *Customer Details:*\n";
      msg += `Name: ${customer.name}\n`;
      msg += `Phone: ${customer.phone}\n`;
      msg += `Address: ${customer.address}\n`;
    }

    msg += "\n🙏 Please confirm my order!";
    return encodeURIComponent(msg);
  },

  openWhatsApp(cart, customer = null) {
    const msg = this.generateWhatsAppMessage(cart, customer);
    // Default WhatsApp number (owner can update in .env)
    const phone = "919876543210";
    const url = `https://wa.me/${phone}?text=${msg}`;
    window.open(url, "_blank");
  },
};
