/* ─────────────────────────────────────────────
   FreshCart — Main Application Logic
   Customer-facing storefront
   ───────────────────────────────────────────── */

const App = {
  state: {
    category: "All",
    search: "",
    cartOpen: false,
    products: [],
    lastOrder: null,
  },

  /* ── Bootstrap ──────────────────────────── */
  async init() {
    this.showLoading(true);
    await this.loadCategories();
    await this.loadProducts();
    this.refreshCartBadge();
    this.bindEvents();
    this.showLoading(false);
  },

  /* ── Loading State ──────────────────────── */
  showLoading(show) {
    const el = document.getElementById("loading-state");
    if (el) el.classList.toggle("hidden", !show);
  },

  /* ── Data Loading ──────────────────────── */
  async loadCategories() {
    try {
      const { data } = await API.getCategories();
      const emojis = {
        Fruits: "🍎", Vegetables: "🥦", Dairy: "🧀",
        Bakery: "🍞", Beverages: "🥤", Snacks: "🍿",
      };
      const bar = document.getElementById("category-bar");
      bar.innerHTML =
        Components.categoryChip("All", "🏪", true) +
        data.map((c) => Components.categoryChip(c, emojis[c] || "📦", false)).join("");
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
  },

  async loadProducts() {
    try {
      const { data, total } = await API.getProducts(this.state.category, this.state.search);
      this.state.products = data;
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
        grid.innerHTML = data.map((p) => Components.productCard(p)).join("");
      }
    } catch (e) {
      console.error("Failed to load products:", e);
      document.getElementById("products-grid").innerHTML =
        '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Failed to load products</h3><p>Please check your connection and try again</p></div>';
    }
  },

  /* ── Cart ───────────────────────────────── */
  refreshCartBadge() {
    const cart = API._getCartData();
    const count = cart.items.reduce((s, i) => s + i.quantity, 0);
    const badge = document.getElementById("cart-badge");
    badge.textContent = count;
    badge.classList.toggle("has-items", count > 0);
  },

  openCart() {
    this.state.cartOpen = true;
    document.getElementById("cart-drawer").classList.add("open");
    document.getElementById("cart-overlay").classList.add("open");
    document.body.classList.add("no-scroll");
    this.renderCart();
  },

  closeCart() {
    this.state.cartOpen = false;
    document.getElementById("cart-drawer").classList.remove("open");
    document.getElementById("cart-overlay").classList.remove("open");
    document.body.classList.remove("no-scroll");
  },

  async renderCart() {
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
      itemsEl.innerHTML = data.items.map((i) => Components.cartItem(i)).join("");
      totalEl.textContent = `₹${data.total.toFixed(2)}`;
    }
  },

  async addToCart(productId) {
    const product = this.state.products.find(
      (p) => (p._id || p.id) === productId
    );
    if (!product) {
      this.showToast("Product not found", "error");
      return;
    }
    if (!product.inStock) {
      this.showToast("Product is out of stock", "error");
      return;
    }
    await API.addToCart(product);
    this.refreshCartBadge();
    if (this.state.cartOpen) this.renderCart();
    this.showToast(`${product.emoji} ${product.name} added to cart!`, "success");
  },

  async updateQty(productId, action) {
    const { data } = await API.getCart();
    const item = data.items.find((i) => i.productId === productId);
    if (!item) return;
    const newQty = action === "increase" ? item.quantity + 1 : item.quantity - 1;
    if (newQty < 1) {
      await this.removeItem(productId);
      return;
    }
    await API.updateCartQty(productId, newQty);
    this.refreshCartBadge();
    this.renderCart();
  },

  async removeItem(productId) {
    await API.removeFromCart(productId);
    this.refreshCartBadge();
    this.renderCart();
    this.showToast("Item removed", "info");
  },

  async clearCart() {
    await API.clearCart();
    this.refreshCartBadge();
    this.renderCart();
    this.showToast("Cart cleared", "info");
  },

  /* ── WhatsApp Order ────────────────────── */
  async orderViaWhatsApp() {
    const { data } = await API.getCart();
    if (data.items.length === 0) {
      this.showToast("Cart is empty", "error");
      return;
    }
    API.openWhatsApp(data);
  },

  /* ── Checkout ──────────────────────────── */
  async openCheckout() {
    this.closeCart();
    const { data } = await API.getCart();
    if (data.items.length === 0) {
      this.showToast("Cart is empty", "error");
      return;
    }
    document.getElementById("checkout-items").innerHTML = data.items
      .map((i) => Components.checkoutItem(i))
      .join("");
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
        name: document.getElementById("checkout-name").value.trim(),
        email: document.getElementById("checkout-email").value.trim(),
        phone: document.getElementById("checkout-phone").value.trim(),
        address: document.getElementById("checkout-address").value.trim(),
      };

      // Validation
      if (!customer.name || customer.name.length < 2) {
        throw new Error("Please enter a valid name");
      }
      if (!customer.phone || customer.phone.replace(/[^0-9]/g, "").length < 10) {
        throw new Error("Please enter a valid phone number");
      }
      if (!customer.address || customer.address.length < 10) {
        throw new Error("Please enter a complete delivery address");
      }

      const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || "cod";

      const { data } = await API.placeOrder(customer, paymentMethod);
      this.state.lastOrder = { ...data, customer };

      this.closeCheckout();
      document.getElementById("checkout-form").reset();

      // Show confirmation
      document.getElementById("confirmation-order-id").textContent = `Order #${data.orderId}`;
      document.getElementById("confirmation-overlay").classList.add("open");
      this.refreshCartBadge();
      this.showToast("Order placed successfully! 🎉", "success");
    } catch (e) {
      this.showToast(e.message, "error");
    } finally {
      btn.disabled = false;
      spinner.classList.add("hidden");
    }
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
    }, 3000);
  },

  /* ── Event Binding ─────────────────────── */
  bindEvents() {
    // Search (debounced)
    let searchTimer;
    document.getElementById("search-input").addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        this.state.search = e.target.value;
        this.loadProducts();
      }, 300);
    });

    // Categories
    document.getElementById("category-bar").addEventListener("click", (e) => {
      const chip = e.target.closest(".category-chip");
      if (!chip) return;
      document.querySelectorAll(".category-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      this.state.category = chip.dataset.category;
      this.loadProducts();
    });

    // Add to cart (delegated)
    document.getElementById("products-grid").addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-add-cart");
      if (btn) {
        this.addToCart(btn.dataset.productId);
        btn.classList.add("added");
        setTimeout(() => btn.classList.remove("added"), 600);
      }
    });

    // Cart drawer
    document.getElementById("cart-btn").addEventListener("click", () => this.openCart());
    document.getElementById("cart-close").addEventListener("click", () => this.closeCart());
    document.getElementById("cart-overlay").addEventListener("click", () => this.closeCart());
    document.getElementById("cart-shop-btn").addEventListener("click", () => this.closeCart());
    document.getElementById("clear-cart-btn").addEventListener("click", () => this.clearCart());

    // WhatsApp order
    document.getElementById("whatsapp-btn").addEventListener("click", () => this.orderViaWhatsApp());

    // Cart item actions (delegated)
    document.getElementById("cart-items").addEventListener("click", (e) => {
      const qtyBtn = e.target.closest(".qty-btn");
      if (qtyBtn) {
        this.updateQty(qtyBtn.dataset.productId, qtyBtn.dataset.action);
        return;
      }
      const removeBtn = e.target.closest(".cart-item-remove");
      if (removeBtn) this.removeItem(removeBtn.dataset.productId);
    });

    // Checkout
    document.getElementById("checkout-btn").addEventListener("click", () => this.openCheckout());
    document.getElementById("checkout-close").addEventListener("click", () => this.closeCheckout());
    document.getElementById("checkout-overlay").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) this.closeCheckout();
    });
    document.getElementById("checkout-form").addEventListener("submit", (e) => this.placeOrder(e));

    // Payment method toggle
    document.querySelectorAll('input[name="payment"]').forEach((radio) => {
      radio.addEventListener("change", (e) => {
        document.querySelectorAll(".payment-option").forEach((opt) => opt.classList.remove("active"));
        e.target.closest(".payment-option").classList.add("active");
        const notice = document.getElementById("online-payment-notice");
        notice.classList.toggle("hidden", e.target.value !== "online");
      });
    });

    // Confirmation modal
    document.getElementById("confirmation-close").addEventListener("click", () => {
      document.getElementById("confirmation-overlay").classList.remove("open");
      document.body.classList.remove("no-scroll");
    });
    document.getElementById("confirmation-whatsapp").addEventListener("click", () => {
      if (this.state.lastOrder) {
        const cart = {
          items: this.state.lastOrder.items,
          total: this.state.lastOrder.total,
        };
        API.openWhatsApp(cart, this.state.lastOrder.customer);
      }
    });

    // Hero CTA scroll
    document.getElementById("hero-cta").addEventListener("click", () => {
      document.getElementById("main-content").scrollIntoView({ behavior: "smooth" });
    });

    // Navbar scroll effect
    window.addEventListener("scroll", () => {
      document.getElementById("navbar").classList.toggle("scrolled", window.scrollY > 50);
    });
  },
};

/* ── Start ────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => App.init());
