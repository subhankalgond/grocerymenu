/* ─────────────────────────────────────────────
   FreshCart — Admin Dashboard Logic
   Auth + Orders + Products Management
   ───────────────────────────────────────────── */

const AdminApp = {
  state: {
    token: null,
    admin: null,
    orders: [],
    products: [],
    currentTab: "orders",
    statusFilter: "all",
    pollingTimer: null,
  },

  BASE: "",

  /* ── Initialization ──────────────────────── */
  init() {
    const saved = localStorage.getItem("freshcart_admin_token");
    const savedAdmin = localStorage.getItem("freshcart_admin_info");

    if (saved && savedAdmin) {
      this.state.token = saved;
      this.state.admin = JSON.parse(savedAdmin);
      this.verifyToken();
    }

    this.bindEvents();
  },

  /* ── API Helper ──────────────────────────── */
  async api(url, options = {}) {
    const headers = { "Content-Type": "application/json", ...options.headers };
    if (this.state.token) {
      headers.Authorization = `Bearer ${this.state.token}`;
    }
    const res = await fetch(this.BASE + url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        this.logout();
        throw new Error("Session expired. Please sign in again.");
      }
      throw new Error(data.message || "Request failed");
    }
    return data;
  },

  /* ── Auth ─────────────────────────────────── */
  async verifyToken() {
    try {
      const { data } = await this.api("/api/auth/me");
      this.state.admin = data;
      this.showDashboard();
    } catch (e) {
      this.logout();
    }
  },

  async handleAuth(e) {
    e.preventDefault();
    const btn = document.getElementById("auth-submit-btn");
    const spinner = document.getElementById("auth-spinner");
    const errorEl = document.getElementById("auth-error");
    errorEl.classList.add("hidden");
    btn.disabled = true;
    spinner.classList.remove("hidden");

    const isSignup = document.getElementById("auth-name-group").classList.contains("hidden") === false;

    try {
      const email = document.getElementById("auth-email").value.trim();
      const password = document.getElementById("auth-password").value;
      const name = document.getElementById("auth-name").value.trim();

      let endpoint = "/api/auth/signin";
      let body = { email, password };

      if (isSignup) {
        if (!name) throw new Error("Name is required");
        endpoint = "/api/auth/signup";
        body = { name, email, password };
      }

      const { data } = await this.api(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      this.state.token = data.token;
      this.state.admin = { id: data.id, name: data.name, email: data.email };
      localStorage.setItem("freshcart_admin_token", data.token);
      localStorage.setItem("freshcart_admin_info", JSON.stringify(this.state.admin));

      this.showDashboard();
      this.showToast(`Welcome, ${data.name}! 🎉`, "success");
    } catch (e) {
      errorEl.classList.remove("hidden");
      errorEl.classList.remove("shake");
      void errorEl.offsetWidth; // trigger reflow
      errorEl.classList.add("shake");
      document.getElementById("auth-error-text").textContent = e.message;
    } finally {
      btn.disabled = false;
      spinner.classList.add("hidden");
    }
  },

  toggleAuthMode() {
    const nameGroup = document.getElementById("auth-name-group");
    const title = document.getElementById("auth-title");
    const subtitle = document.getElementById("auth-subtitle");
    const submitText = document.getElementById("auth-submit-text");
    const submitBtn = document.getElementById("auth-submit-btn");
    const switchText = document.getElementById("auth-switch-text");
    const switchBtn = document.getElementById("auth-switch-btn");
    const errorEl = document.getElementById("auth-error");
    errorEl.classList.add("hidden");

    const isCurrentlySignin = nameGroup.classList.contains("hidden");
    if (isCurrentlySignin) {
      // Switch to signup
      nameGroup.classList.remove("hidden");
      title.textContent = "Create Account";
      subtitle.textContent = "Create your admin account to get started";
      submitText.textContent = "Create Account";
      submitBtn.classList.add("btn-signup");
      switchText.textContent = "Already have an account?";
      switchBtn.textContent = "Sign In";
    } else {
      // Switch to signin
      nameGroup.classList.add("hidden");
      title.textContent = "Admin Sign In";
      subtitle.textContent = "Sign in to manage your store";
      submitText.textContent = "Sign In";
      submitBtn.classList.remove("btn-signup");
      switchText.textContent = "Don't have an account?";
      switchBtn.textContent = "Create Account";
    }
  },

  logout() {
    this.state.token = null;
    this.state.admin = null;
    localStorage.removeItem("freshcart_admin_token");
    localStorage.removeItem("freshcart_admin_info");
    if (this.state.pollingTimer) clearInterval(this.state.pollingTimer);
    document.getElementById("auth-gate").classList.remove("hidden");
    document.getElementById("admin-dashboard").classList.add("hidden");
  },

  /* ── Dashboard ───────────────────────────── */
  showDashboard() {
    document.getElementById("auth-gate").classList.add("hidden");
    document.getElementById("admin-dashboard").classList.remove("hidden");
    document.getElementById("admin-name-display").textContent = this.state.admin?.name || "Admin";
    this.loadStats();
    this.loadOrders();
    this.startPolling();
  },

  startPolling() {
    if (this.state.pollingTimer) clearInterval(this.state.pollingTimer);
    this.state.pollingTimer = setInterval(() => {
      this.checkNewOrders();
    }, 15000); // poll every 15s
  },

  async checkNewOrders() {
    try {
      const { count } = await this.api("/api/orders/new-count");
      const badge = document.getElementById("new-orders-badge");
      if (count > 0) {
        badge.textContent = count;
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    } catch (e) {
      /* ignore polling errors */
    }
  },

  /* ── Stats ───────────────────────────────── */
  async loadStats() {
    try {
      const { data } = await this.api("/api/orders/stats");
      document.getElementById("stat-total-orders").textContent = data.totalOrders;
      document.getElementById("stat-pending").textContent = data.pendingOrders;
      document.getElementById("stat-accepted").textContent = data.acceptedOrders;
      document.getElementById("stat-delivered").textContent = data.deliveredOrders;
      document.getElementById("stat-revenue").textContent = `₹${data.totalRevenue.toLocaleString("en-IN")}`;
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  },

  /* ── Orders ──────────────────────────────── */
  async loadOrders() {
    try {
      const { data } = await this.api(`/api/orders?status=${this.state.statusFilter}`);
      this.state.orders = data;
      this.renderOrders();
      this.checkNewOrders();
    } catch (e) {
      console.error("Failed to load orders:", e);
      this.showToast("Failed to load orders", "error");
    }
  },

  renderOrders() {
    const list = document.getElementById("orders-list");
    const empty = document.getElementById("orders-empty");

    if (this.state.orders.length === 0) {
      list.innerHTML = "";
      list.appendChild(empty);
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");
    list.innerHTML = this.state.orders.map((order) => this.orderCard(order)).join("");
  },

  orderCard(order) {
    const statusColors = {
      pending: "status-pending",
      accepted: "status-accepted",
      delivered: "status-delivered",
      cancelled: "status-cancelled",
    };
    const statusIcons = {
      pending: "⏳",
      accepted: "✅",
      delivered: "🚚",
      cancelled: "❌",
    };
    const date = new Date(order.createdAt).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    const isNewBadge = order.isNewOrder ? '<span class="new-badge">NEW</span>' : "";
    const itemsPills = order.items
      .map((i) => `<span class="order-item-pill">${i.emoji} ${i.name} ×${i.quantity}</span>`)
      .join("");

    return `
      <div class="order-card ${order.isNewOrder ? 'order-new' : ''}" data-order-id="${order._id}">
        <div class="order-header">
          <div class="order-id-wrap">
            <span class="order-id">Order #${order.orderId}</span>
            ${isNewBadge}
          </div>
          <span class="order-status ${statusColors[order.status]}">${statusIcons[order.status]} ${order.status}</span>
        </div>
        <div class="order-date">${date}</div>
        <div class="order-customer-info">
          <span>👤 ${order.customer.name}</span>
          <span>📞 ${order.customer.phone}</span>
        </div>
        <div class="order-items-list">${itemsPills}</div>
        <div class="order-footer">
          <span class="order-total">₹${order.total.toFixed(2)}</span>
          <div class="order-actions">
            ${order.status === "pending" ? `
              <button class="btn-status-action btn-accept" data-id="${order._id}" data-status="accepted" title="Accept Order">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                Accept
              </button>` : ""}
            ${order.status === "accepted" ? `
              <button class="btn-status-action btn-deliver" data-id="${order._id}" data-status="delivered" title="Mark Delivered">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                Deliver
              </button>` : ""}
            ${order.status !== "cancelled" && order.status !== "delivered" ? `
              <button class="btn-status-action btn-cancel-order" data-id="${order._id}" data-status="cancelled" title="Cancel Order">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>` : ""}
            <button class="btn-view-order" data-id="${order._id}" title="View Details">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
      </div>`;
  },

  async updateOrderStatus(orderId, status) {
    try {
      await this.api(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      this.showToast(`Order ${status} successfully!`, "success");
      this.loadOrders();
      this.loadStats();
    } catch (e) {
      this.showToast(e.message, "error");
    }
  },

  async viewOrderDetail(orderId) {
    const order = this.state.orders.find((o) => o._id === orderId);
    if (!order) return;

    // Mark as read
    if (order.isNewOrder) {
      try {
        await this.api(`/api/orders/${orderId}/mark-read`, { method: "PATCH" });
        order.isNewOrder = false;
        this.renderOrders();
        this.checkNewOrders();
      } catch (e) {/* ignore */}
    }

    document.getElementById("order-detail-title").textContent = `Order #${order.orderId}`;

    const date = new Date(order.createdAt).toLocaleString("en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const paymentLabels = { cod: "💵 Cash on Delivery", online: "📱 Online Payment" };
    const statusLabels = {
      pending: '<span class="detail-status status-pending">⏳ Pending</span>',
      accepted: '<span class="detail-status status-accepted">✅ Accepted</span>',
      delivered: '<span class="detail-status status-delivered">🚚 Delivered</span>',
      cancelled: '<span class="detail-status status-cancelled">❌ Cancelled</span>',
    };

    const itemsRows = order.items.map((i) => `
      <tr>
        <td>${i.emoji} ${i.name}</td>
        <td>₹${i.price}</td>
        <td>×${i.quantity}</td>
        <td class="detail-subtotal">₹${i.subtotal.toFixed(2)}</td>
      </tr>`).join("");

    document.getElementById("order-detail-body").innerHTML = `
      <div class="detail-section">
        <div class="detail-row">
          <span class="detail-label">Status</span>
          ${statusLabels[order.status]}
        </div>
        <div class="detail-row">
          <span class="detail-label">Date</span>
          <span>${date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment</span>
          <span>${paymentLabels[order.paymentMethod] || order.paymentMethod}</span>
        </div>
      </div>
      <div class="detail-section">
        <h3>👤 Customer</h3>
        <div class="detail-row"><span class="detail-label">Name</span><span>${order.customer.name}</span></div>
        <div class="detail-row"><span class="detail-label">Phone</span><span><a href="tel:${order.customer.phone}" class="detail-link">${order.customer.phone}</a></span></div>
        ${order.customer.email ? `<div class="detail-row"><span class="detail-label">Email</span><span><a href="mailto:${order.customer.email}" class="detail-link">${order.customer.email}</a></span></div>` : ""}
        <div class="detail-row"><span class="detail-label">Address</span><span>${order.customer.address}</span></div>
      </div>
      <div class="detail-section">
        <h3>📦 Items</h3>
        <table class="detail-items-table">
          <thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr></thead>
          <tbody>${itemsRows}</tbody>
          <tfoot><tr><td colspan="3" class="detail-total-label">Total</td><td class="detail-total-value">₹${order.total.toFixed(2)}</td></tr></tfoot>
        </table>
      </div>
    `;

    document.getElementById("order-detail-overlay").classList.add("open");
    document.body.classList.add("no-scroll");
  },

  closeOrderDetail() {
    document.getElementById("order-detail-overlay").classList.remove("open");
    document.body.classList.remove("no-scroll");
  },

  /* ── Products ────────────────────────────── */
  async loadProducts() {
    try {
      const { data } = await this.api("/api/products");
      this.state.products = data;
      this.renderProducts();
    } catch (e) {
      console.error("Failed to load products:", e);
      this.showToast("Failed to load products", "error");
    }
  },

  renderProducts() {
    const tbody = document.getElementById("products-tbody");
    const empty = document.getElementById("products-empty");

    if (this.state.products.length === 0) {
      tbody.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");
    tbody.innerHTML = this.state.products.map((p) => `
      <tr data-product-id="${p._id}">
        <td class="product-emoji-cell">${p.emoji}</td>
        <td>
          <strong>${p.name}</strong>
          <small class="product-desc">${p.description || ""}</small>
        </td>
        <td><span class="category-badge">${p.category}</span></td>
        <td class="price-cell">
          <span class="price-symbol">₹</span>
          <input type="number" class="inline-price" value="${p.price}" data-id="${p._id}" min="0" step="1" />
        </td>
        <td>${p.unit}</td>
        <td>
          <button class="stock-toggle ${p.inStock ? 'in-stock' : 'out-stock'}" data-id="${p._id}" title="${p.inStock ? 'In Stock — click to mark Out' : 'Out of Stock — click to mark In'}">
            ${p.inStock ? "✅ In Stock" : "❌ Out"}
          </button>
        </td>
        <td>
          <button class="btn-delete-product" data-id="${p._id}" title="Delete Product">🗑️</button>
        </td>
      </tr>`).join("");
  },

  async toggleStock(productId) {
    try {
      await this.api(`/api/products/${productId}/toggle-stock`, { method: "PATCH" });
      this.loadProducts();
      this.showToast("Stock updated!", "success");
    } catch (e) {
      this.showToast(e.message, "error");
    }
  },

  async updatePrice(productId, newPrice) {
    try {
      await this.api(`/api/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify({ price: Number(newPrice) }),
      });
      this.showToast("Price updated!", "success");
    } catch (e) {
      this.showToast(e.message, "error");
    }
  },

  async deleteProduct(productId) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await this.api(`/api/products/${productId}`, { method: "DELETE" });
      this.loadProducts();
      this.showToast("Product deleted!", "success");
    } catch (e) {
      this.showToast(e.message, "error");
    }
  },

  async addProduct(e) {
    e.preventDefault();
    const btn = document.getElementById("save-product-btn");
    btn.disabled = true;

    try {
      const product = {
        name: document.getElementById("product-name").value.trim(),
        category: document.getElementById("product-category").value,
        price: Number(document.getElementById("product-price").value),
        unit: document.getElementById("product-unit").value.trim(),
        emoji: document.getElementById("product-emoji").value.trim() || "📦",
        description: document.getElementById("product-description").value.trim(),
        rating: Number(document.getElementById("product-rating").value) || 4.5,
        inStock: true,
      };

      await this.api("/api/products", {
        method: "POST",
        body: JSON.stringify(product),
      });

      document.getElementById("product-form").reset();
      document.getElementById("add-product-form").classList.add("hidden");
      this.loadProducts();
      this.showToast("Product added! 🎉", "success");
    } catch (e) {
      this.showToast(e.message, "error");
    } finally {
      btn.disabled = false;
    }
  },

  /* ── Tab Switching ───────────────────────── */
  switchTab(tab) {
    this.state.currentTab = tab;
    document.querySelectorAll(".admin-tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.tab === tab);
    });
    document.getElementById("orders-panel").classList.toggle("hidden", tab !== "orders");
    document.getElementById("products-panel").classList.toggle("hidden", tab !== "products");

    if (tab === "products" && this.state.products.length === 0) {
      this.loadProducts();
    }
  },

  /* ── Toast ───────────────────────────────── */
  showToast(msg, type = "success") {
    const container = document.getElementById("toast-container");
    const icons = { success: "✅", error: "❌", info: "ℹ️" };
    const html = `<div class="toast toast-${type}"><span class="toast-icon">${icons[type] || "ℹ️"}</span><span class="toast-msg">${msg}</span></div>`;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    const toast = wrapper.firstElementChild;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  },

  /* ── Event Binding ───────────────────────── */
  bindEvents() {
    // Auth form
    document.getElementById("auth-form").addEventListener("submit", (e) => this.handleAuth(e));
    document.getElementById("auth-switch-btn").addEventListener("click", () => this.toggleAuthMode());
    document.getElementById("password-toggle").addEventListener("click", () => {
      const input = document.getElementById("auth-password");
      const toggle = document.getElementById("password-toggle");
      if (input.type === "password") {
        input.type = "text";
        toggle.classList.add("showing");
      } else {
        input.type = "password";
        toggle.classList.remove("showing");
      }
    });

    // Sign out
    document.getElementById("signout-btn").addEventListener("click", () => {
      this.logout();
      this.showToast("Signed out", "info");
    });

    // Tabs
    document.getElementById("admin-tabs").addEventListener("click", (e) => {
      const tab = e.target.closest(".admin-tab");
      if (tab) this.switchTab(tab.dataset.tab);
    });

    // Order filter
    document.getElementById("order-status-filter").addEventListener("change", (e) => {
      this.state.statusFilter = e.target.value;
      this.loadOrders();
    });

    // Refresh orders
    document.getElementById("refresh-orders-btn").addEventListener("click", () => {
      this.loadOrders();
      this.loadStats();
      this.showToast("Orders refreshed!", "info");
    });

    // Order actions (delegated)
    document.getElementById("orders-list").addEventListener("click", (e) => {
      const statusBtn = e.target.closest(".btn-status-action");
      if (statusBtn) {
        this.updateOrderStatus(statusBtn.dataset.id, statusBtn.dataset.status);
        return;
      }
      const viewBtn = e.target.closest(".btn-view-order");
      if (viewBtn) {
        this.viewOrderDetail(viewBtn.dataset.id);
        return;
      }
    });

    // Order detail modal close
    document.getElementById("order-detail-close").addEventListener("click", () => this.closeOrderDetail());
    document.getElementById("order-detail-overlay").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) this.closeOrderDetail();
    });

    // Product actions
    document.getElementById("add-product-btn").addEventListener("click", () => {
      document.getElementById("add-product-form").classList.toggle("hidden");
    });
    document.getElementById("cancel-product-btn").addEventListener("click", () => {
      document.getElementById("add-product-form").classList.add("hidden");
      document.getElementById("product-form").reset();
    });
    document.getElementById("product-form").addEventListener("submit", (e) => this.addProduct(e));

    // Product table actions (delegated)
    document.getElementById("products-table").addEventListener("click", (e) => {
      const stockBtn = e.target.closest(".stock-toggle");
      if (stockBtn) {
        this.toggleStock(stockBtn.dataset.id);
        return;
      }
      const deleteBtn = e.target.closest(".btn-delete-product");
      if (deleteBtn) {
        this.deleteProduct(deleteBtn.dataset.id);
        return;
      }
    });

    // Inline price editing (delegated)
    document.getElementById("products-table").addEventListener("change", (e) => {
      if (e.target.classList.contains("inline-price")) {
        this.updatePrice(e.target.dataset.id, e.target.value);
      }
    });
  },
};

/* ── Start ────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => AdminApp.init());
