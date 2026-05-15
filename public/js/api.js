/* ─────────────────────────────────────────────
   FreshCart — API Client
   Agent 3: Frontend Engineer
   ───────────────────────────────────────────── */

const API = {
  base: "/api",

  async request(path, options = {}) {
    try {
      const res = await fetch(`${this.base}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      return data;
    } catch (err) {
      console.error(`API Error [${path}]:`, err);
      throw err;
    }
  },

  // ── Products ─────────────────────────────
  getProducts(category = "All", search = "") {
    const params = new URLSearchParams();
    if (category && category !== "All") params.set("category", category);
    if (search) params.set("search", search);
    const qs = params.toString();
    return this.request(`/products${qs ? "?" + qs : ""}`);
  },

  getCategories() {
    return this.request("/products/categories");
  },

  // ── Cart ──────────────────────────────────
  getCart() {
    return this.request("/cart");
  },

  addToCart(productId, quantity = 1) {
    return this.request("/cart", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });
  },

  updateCartItem(productId, quantity) {
    return this.request(`/cart/${productId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
  },

  removeFromCart(productId) {
    return this.request(`/cart/${productId}`, { method: "DELETE" });
  },

  clearCart() {
    return this.request("/cart", { method: "DELETE" });
  },

  // ── Orders ────────────────────────────────
  placeOrder(customer) {
    return this.request("/orders", {
      method: "POST",
      body: JSON.stringify(customer),
    });
  },

  getOrders() {
    return this.request("/orders");
  },
};
