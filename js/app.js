/* ─────────────────────────────────────────────
   FreshCart — Main Application Logic
   Agent 3 + Agent 4: Frontend + Integration
   ───────────────────────────────────────────── */

const App = {
  state: { category: "All", search: "", cartOpen: false },

  /* ── Bootstrap ──────────────────────────── */
  async init() {
    await this.loadCategories();
    await this.loadProducts();
    await this.refreshCartBadge();
    this.updateAuthUI();
    this.bindEvents();
  },

  /* ── Auth UI State ──────────────────────── */
  updateAuthUI() {
    const loggedIn = Auth.isLoggedIn();
    const session = Auth.getSession();
    const adminBtnLabel = document.getElementById("admin-btn-label");
    const signoutBtn = document.getElementById("signout-btn");
    const adminBtn = document.getElementById("admin-btn");

    if (loggedIn && session) {
      adminBtnLabel.textContent = session.name.split(" ")[0];
      adminBtn.classList.add("admin-logged-in");
      signoutBtn.classList.remove("hidden");
    } else {
      adminBtnLabel.textContent = "Admin";
      adminBtn.classList.remove("admin-logged-in");
      signoutBtn.classList.add("hidden");
    }
  },

  /* ── Data Loading ──────────────────────── */
  async loadCategories() {
    try {
      const { data } = await API.getCategories();
      const emojis = { Fruits: "🍎", Vegetables: "🥦", Dairy: "🧀", Bakery: "🍞", Beverages: "🥤", Snacks: "🍿" };
      const bar = document.getElementById("category-bar");
      bar.innerHTML = Components.categoryChip("All", "🏪", true) +
        data.map(c => Components.categoryChip(c, emojis[c] || "📦", false)).join("");
    } catch (e) { console.error(e); }
  },

  async loadProducts() {
    try {
      const { data, total } = await API.getProducts(this.state.category, this.state.search);
      const grid = document.getElementById("products-grid");
      const empty = document.getElementById("empty-state");
      const count = document.getElementById("product-count");
      const title = document.getElementById("section-title");

      count.textContent = `${total} item${total !== 1 ? "s" : ""}`;
      title.textContent = this.state.category === "All" ? "All Products" : this.state.category;

      if (total === 0) {
        grid.innerHTML = "";
        empty.classList.remove("hidden");
      } else {
        empty.classList.add("hidden");
        grid.innerHTML = data.map(p => Components.productCard(p)).join("");
      }
    } catch (e) { console.error(e); }
  },

  /* ── Cart ───────────────────────────────── */
  async refreshCartBadge() {
    try {
      const { data } = await API.getCart();
      document.getElementById("cart-badge").textContent = data.count;
      document.getElementById("cart-badge").classList.toggle("has-items", data.count > 0);
    } catch (e) { console.error(e); }
  },

  async openCart() {
    this.state.cartOpen = true;
    document.getElementById("cart-drawer").classList.add("open");
    document.getElementById("cart-overlay").classList.add("open");
    document.body.classList.add("no-scroll");
    await this.renderCart();
  },

  closeCart() {
    this.state.cartOpen = false;
    document.getElementById("cart-drawer").classList.remove("open");
    document.getElementById("cart-overlay").classList.remove("open");
    document.body.classList.remove("no-scroll");
  },

  async renderCart() {
    try {
      const { data } = await API.getCart();
      const itemsEl = document.getElementById("cart-items");
      const emptyEl = document.getElementById("cart-empty");
      const footer = document.getElementById("cart-footer");
      const totalEl = document.getElementById("cart-total");

      if (data.items.length === 0) {
        itemsEl.innerHTML = "";
        emptyEl.classList.remove("hidden");
        footer.classList.add("hidden");
      } else {
        emptyEl.classList.add("hidden");
        footer.classList.remove("hidden");
        itemsEl.innerHTML = data.items.map(i => Components.cartItem(i)).join("");
        totalEl.textContent = `₹${data.total.toFixed(2)}`;
      }
    } catch (e) { console.error(e); }
  },

  async addToCart(productId) {
    try {
      await API.addToCart(productId);
      await this.refreshCartBadge();
      if (this.state.cartOpen) await this.renderCart();
      this.showToast("Added to cart!", "success");
    } catch (e) { this.showToast(e.message, "error"); }
  },

  async updateQty(productId, action) {
    try {
      const { data } = await API.getCart();
      const item = data.items.find(i => i.productId === productId);
      if (!item) return;
      const newQty = action === "increase" ? item.quantity + 1 : item.quantity - 1;
      if (newQty < 1) { await this.removeItem(productId); return; }
      await API.updateCartItem(productId, newQty);
      await this.refreshCartBadge();
      await this.renderCart();
    } catch (e) { this.showToast(e.message, "error"); }
  },

  async removeItem(productId) {
    try {
      await API.removeFromCart(productId);
      await this.refreshCartBadge();
      await this.renderCart();
      this.showToast("Item removed", "info");
    } catch (e) { this.showToast(e.message, "error"); }
  },

  async clearCart() {
    try {
      await API.clearCart();
      await this.refreshCartBadge();
      await this.renderCart();
      this.showToast("Cart cleared", "info");
    } catch (e) { this.showToast(e.message, "error"); }
  },

  /* ── Checkout ──────────────────────────── */
  async openCheckout() {
    this.closeCart();
    const { data } = await API.getCart();
    if (data.items.length === 0) { this.showToast("Cart is empty", "error"); return; }
    document.getElementById("checkout-items").innerHTML = data.items.map(i => Components.checkoutItem(i)).join("");
    document.getElementById("checkout-total-amount").textContent = `₹${data.total.toFixed(2)}`;
    document.getElementById("checkout-overlay").classList.add("open");
    document.body.classList.add("no-scroll");
  },

  closeCheckout() {
    document.getElementById("checkout-overlay").classList.remove("open");
    document.body.classList.remove("no-scroll");
  },

  async placeOrder(e) {
    e.preventDefault();
    const btn = document.getElementById("place-order-btn");
    const spinner = document.getElementById("order-spinner");
    btn.disabled = true;
    spinner.classList.remove("hidden");

    try {
      const customer = {
        name: document.getElementById("checkout-name").value,
        email: document.getElementById("checkout-email").value,
        phone: document.getElementById("checkout-phone").value,
        address: document.getElementById("checkout-address").value,
      };
      const { data } = await API.placeOrder(customer);
      this.closeCheckout();
      document.getElementById("checkout-form").reset();
      document.getElementById("confirmation-order-id").textContent = `Order #${data.id}`;
      document.getElementById("confirmation-overlay").classList.add("open");
      await this.refreshCartBadge();
    } catch (e) {
      this.showToast(e.message, "error");
    } finally {
      btn.disabled = false;
      spinner.classList.add("hidden");
    }
  },

  /* ── Orders ────────────────────────────── */
  async openOrders() {
    document.getElementById("orders-overlay").classList.add("open");
    document.body.classList.add("no-scroll");
    try {
      const { data } = await API.getOrders();
      const list = document.getElementById("orders-list");
      const empty = document.getElementById("orders-empty");
      if (data.length === 0) { empty.classList.remove("hidden"); list.innerHTML = ""; list.appendChild(empty); }
      else { list.innerHTML = data.map(o => Components.orderCard(o)).join(""); }
    } catch (e) { console.error(e); }
  },

  closeOrders() {
    document.getElementById("orders-overlay").classList.remove("open");
    document.body.classList.remove("no-scroll");
  },

  /* ── Toast ─────────────────────────────── */
  showToast(msg, type = "success") {
    const container = document.getElementById("toast-container");
    const el = document.createElement("div");
    el.innerHTML = Components.toast(msg, type);
    const toast = el.firstElementChild;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, 2500);
  },

  /* ── Event Binding ─────────────────────── */
  bindEvents() {
    // Search
    let searchTimer;
    document.getElementById("search-input").addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { this.state.search = e.target.value; this.loadProducts(); }, 300);
    });

    // Categories
    document.getElementById("category-bar").addEventListener("click", (e) => {
      const chip = e.target.closest(".category-chip");
      if (!chip) return;
      document.querySelectorAll(".category-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      this.state.category = chip.dataset.category;
      this.loadProducts();
    });

    // Add to cart (delegated)
    document.getElementById("products-grid").addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-add-cart");
      if (btn) { this.addToCart(parseInt(btn.dataset.productId)); btn.classList.add("added"); setTimeout(() => btn.classList.remove("added"), 600); }
    });

    // Cart drawer
    document.getElementById("cart-btn").addEventListener("click", () => this.openCart());
    document.getElementById("cart-close").addEventListener("click", () => this.closeCart());
    document.getElementById("cart-overlay").addEventListener("click", () => this.closeCart());
    document.getElementById("cart-shop-btn").addEventListener("click", () => this.closeCart());
    document.getElementById("clear-cart-btn").addEventListener("click", () => this.clearCart());

    // Cart item actions (delegated)
    document.getElementById("cart-items").addEventListener("click", (e) => {
      const qtyBtn = e.target.closest(".qty-btn");
      if (qtyBtn) { this.updateQty(parseInt(qtyBtn.dataset.productId), qtyBtn.dataset.action); return; }
      const removeBtn = e.target.closest(".cart-item-remove");
      if (removeBtn) this.removeItem(parseInt(removeBtn.dataset.productId));
    });

    // Checkout
    document.getElementById("checkout-btn").addEventListener("click", () => this.openCheckout());
    document.getElementById("checkout-close").addEventListener("click", () => this.closeCheckout());
    document.getElementById("checkout-overlay").addEventListener("click", (e) => { if (e.target === e.currentTarget) this.closeCheckout(); });
    document.getElementById("checkout-form").addEventListener("submit", (e) => this.placeOrder(e));

    // Confirmation
    document.getElementById("confirmation-close").addEventListener("click", () => {
      document.getElementById("confirmation-overlay").classList.remove("open");
      document.body.classList.remove("no-scroll");
    });

    // Orders
    document.getElementById("orders-btn").addEventListener("click", () => this.openOrders());
    document.getElementById("orders-close").addEventListener("click", () => this.closeOrders());
    document.getElementById("orders-overlay").addEventListener("click", (e) => { if (e.target === e.currentTarget) this.closeOrders(); });

    // Hero CTA scroll
    document.getElementById("hero-cta").addEventListener("click", () => {
      document.getElementById("main-content").scrollIntoView({ behavior: "smooth" });
    });

    // Navbar scroll effect
    window.addEventListener("scroll", () => {
      document.getElementById("navbar").classList.toggle("scrolled", window.scrollY > 50);
    });

    // Admin panel (gated behind auth)
    document.getElementById("admin-btn").addEventListener("click", () => {
      if (Auth.isLoggedIn()) { this.openAdmin(); }
      else { this.openAuth(); }
    });
    document.getElementById("admin-close").addEventListener("click", () => this.closeAdmin());
    document.getElementById("admin-overlay").addEventListener("click", (e) => { if (e.target === e.currentTarget) this.closeAdmin(); });
    document.getElementById("add-product-form").addEventListener("submit", (e) => this.adminAddProduct(e));

    // Admin delegated events
    document.getElementById("admin-products").addEventListener("click", (e) => {
      const stockBtn = e.target.closest(".admin-stock-btn");
      if (stockBtn) { this.adminToggleStock(parseInt(stockBtn.dataset.productId)); return; }
      const delBtn = e.target.closest(".admin-delete-btn");
      if (delBtn) { this.adminDeleteProduct(parseInt(delBtn.dataset.productId)); return; }
    });
    document.getElementById("admin-products").addEventListener("change", (e) => {
      const priceInput = e.target.closest(".admin-price-input");
      if (priceInput) { this.adminUpdatePrice(parseInt(priceInput.dataset.productId), parseFloat(priceInput.value)); }
    });

    // Sign Out
    document.getElementById("signout-btn").addEventListener("click", () => this.handleSignOut());

    // Auth modal
    document.getElementById("auth-close").addEventListener("click", () => this.closeAuth());
    document.getElementById("auth-overlay").addEventListener("click", (e) => { if (e.target === e.currentTarget) this.closeAuth(); });
    document.getElementById("signin-form").addEventListener("submit", (e) => this.handleSignIn(e));
    document.getElementById("signup-form").addEventListener("submit", (e) => this.handleSignUp(e));
    document.getElementById("show-signup").addEventListener("click", () => this.showAuthForm("signup"));
    document.getElementById("show-signin").addEventListener("click", () => this.showAuthForm("signin"));

    // Password toggles
    document.querySelectorAll(".password-toggle").forEach(btn => {
      btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.target);
        input.type = input.type === "password" ? "text" : "password";
        btn.classList.toggle("showing");
      });
    });
  },

  /* ── Auth Modal ────────────────────────── */
  openAuth() {
    this.showAuthForm("signin");
    document.getElementById("auth-overlay").classList.add("open");
    document.body.classList.add("no-scroll");
    document.getElementById("auth-error").classList.add("hidden");

    // Pre-fill saved credentials if available
    const saved = Auth.getSavedCredentials();
    if (saved) {
      document.getElementById("signin-email").value = saved.email || "";
      document.getElementById("signin-password").value = saved.password || "";
    }
  },

  closeAuth() {
    document.getElementById("auth-overlay").classList.remove("open");
    document.body.classList.remove("no-scroll");
    document.getElementById("signin-form").reset();
    document.getElementById("signup-form").reset();
    document.getElementById("auth-error").classList.add("hidden");
  },

  showAuthForm(which) {
    const signinForm = document.getElementById("signin-form");
    const signupForm = document.getElementById("signup-form");
    const title = document.getElementById("auth-modal-title");
    document.getElementById("auth-error").classList.add("hidden");

    if (which === "signup") {
      signinForm.classList.add("hidden");
      signupForm.classList.remove("hidden");
      title.textContent = "✨ Admin Sign Up";
    } else {
      signupForm.classList.add("hidden");
      signinForm.classList.remove("hidden");
      title.textContent = "🔐 Admin Sign In";
    }
  },

  showAuthError(msg) {
    const el = document.getElementById("auth-error");
    document.getElementById("auth-error-msg").textContent = msg;
    el.classList.remove("hidden");
    el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 500);
  },

  async handleSignIn(e) {
    e.preventDefault();
    try {
      const email = document.getElementById("signin-email").value;
      const password = document.getElementById("signin-password").value;
      const admin = await Auth.signIn(email, password);
      this.closeAuth();
      this.updateAuthUI();
      this.showToast(`Welcome back, ${admin.name}!`, "success");
      // Auto-open admin panel after successful login
      setTimeout(() => this.openAdmin(), 400);
    } catch (err) {
      this.showAuthError(err.message);
    }
  },

  async handleSignUp(e) {
    e.preventDefault();
    try {
      const name = document.getElementById("signup-name").value;
      const email = document.getElementById("signup-email").value;
      const password = document.getElementById("signup-password").value;
      const confirm = document.getElementById("signup-confirm").value;

      if (password !== confirm) {
        throw new Error("Passwords do not match");
      }

      const admin = await Auth.signUp(name, email, password);
      this.closeAuth();
      this.updateAuthUI();
      this.showToast(`Welcome, ${admin.name}! Account created.`, "success");
      // Auto-open admin panel after successful signup
      setTimeout(() => this.openAdmin(), 400);
    } catch (err) {
      this.showAuthError(err.message);
    }
  },

  handleSignOut() {
    Auth.signOut();
    this.updateAuthUI();
    this.showToast("Signed out successfully", "info");
  },

  /* ── Admin Panel ────────────────────────── */
  openAdmin() {
    if (!Auth.isLoggedIn()) {
      this.openAuth();
      return;
    }
    document.getElementById("admin-overlay").classList.add("open");
    document.body.classList.add("no-scroll");
    this.renderAdminProducts();
  },

  closeAdmin() {
    document.getElementById("admin-overlay").classList.remove("open");
    document.body.classList.remove("no-scroll");
  },

  renderAdminProducts() {
    const el = document.getElementById("admin-products");
    el.innerHTML = PRODUCTS.map(p => Components.adminProductRow(p)).join("");
  },

  async adminToggleStock(productId) {
    try {
      const { data } = await API.toggleStock(productId);
      this.showToast(`${data.name} is now ${data.inStock ? 'available' : 'unavailable'}`, "info");
      this.renderAdminProducts();
      this.loadProducts();
    } catch (e) { this.showToast(e.message, "error"); }
  },

  async adminUpdatePrice(productId, newPrice) {
    try {
      if (isNaN(newPrice) || newPrice < 0) return;
      await API.updatePrice(productId, newPrice);
      this.loadProducts();
    } catch (e) { this.showToast(e.message, "error"); }
  },

  async adminDeleteProduct(productId) {
    try {
      await API.deleteProduct(productId);
      this.showToast("Product deleted", "info");
      this.renderAdminProducts();
      this.loadProducts();
      this.refreshCartBadge();
    } catch (e) { this.showToast(e.message, "error"); }
  },

  async adminAddProduct(e) {
    e.preventDefault();
    try {
      const product = {
        name: document.getElementById("ap-name").value,
        emoji: document.getElementById("ap-emoji").value,
        category: document.getElementById("ap-category").value,
        price: document.getElementById("ap-price").value,
        unit: document.getElementById("ap-unit").value,
        description: document.getElementById("ap-desc").value,
      };
      await API.addProduct(product);
      document.getElementById("add-product-form").reset();
      this.showToast("Product added!", "success");
      this.renderAdminProducts();
      this.loadProducts();
      this.loadCategories();
    } catch (e) { this.showToast(e.message, "error"); }
  },
};

/* ── Start ────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => App.init());
