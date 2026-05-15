/* ─────────────────────────────────────────────
   FreshCart — UI Component Renderers
   Agent 3: Frontend Engineer
   ───────────────────────────────────────────── */

const Components = {
  productCard(product) {
    const stockClass = product.inStock ? "" : "out-of-stock";
    const stockBadge = product.inStock ? "" : '<span class="stock-badge">Out of Stock</span>';
    const stars = "★".repeat(Math.floor(product.rating)) + "☆".repeat(5 - Math.floor(product.rating));

    return `
      <article class="product-card ${stockClass}" data-product-id="${product.id}">
        <div class="card-visual">
          <span class="card-emoji">${product.emoji}</span>
          <span class="card-category">${product.category}</span>
          ${stockBadge}
        </div>
        <div class="card-body">
          <h3 class="card-title">${product.name}</h3>
          <p class="card-desc">${product.description}</p>
          <div class="card-meta">
            <span class="card-rating" title="${product.rating}/5">${stars} <small>${product.rating}</small></span>
            <span class="card-unit">${product.unit}</span>
          </div>
          <div class="card-footer">
            <span class="card-price">$${product.price.toFixed(2)}</span>
            <button class="btn-add-cart" data-product-id="${product.id}" ${!product.inStock ? "disabled" : ""}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add
            </button>
          </div>
        </div>
      </article>`;
  },

  cartItem(item) {
    return `
      <div class="cart-item" data-product-id="${item.productId}">
        <span class="cart-item-emoji">${item.product.emoji}</span>
        <div class="cart-item-info">
          <h4>${item.product.name}</h4>
          <span class="cart-item-price">$${item.product.price.toFixed(2)} × ${item.quantity}</span>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn qty-minus" data-product-id="${item.productId}" data-action="decrease">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn qty-plus" data-product-id="${item.productId}" data-action="increase">+</button>
        </div>
        <span class="cart-item-subtotal">$${item.subtotal.toFixed(2)}</span>
        <button class="cart-item-remove" data-product-id="${item.productId}" title="Remove">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`;
  },

  checkoutItem(item) {
    return `
      <div class="checkout-item">
        <span>${item.product.emoji} ${item.product.name}</span>
        <span>×${item.quantity}</span>
        <span>$${item.subtotal.toFixed(2)}</span>
      </div>`;
  },

  orderCard(order) {
    const date = new Date(order.createdAt).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
    const pills = order.items.map(i => `<span class="order-item-pill">${i.emoji} ${i.name} ×${i.quantity}</span>`).join("");
    return `
      <div class="order-card">
        <div class="order-header">
          <span class="order-id">Order #${order.id}</span>
          <span class="order-status status-${order.status}">${order.status}</span>
        </div>
        <div class="order-date">${date}</div>
        <div class="order-items-list">${pills}</div>
        <div class="order-footer">
          <span class="order-total">Total: <strong>$${order.total.toFixed(2)}</strong></span>
          <span class="order-customer">📍 ${order.customer.name}</span>
        </div>
      </div>`;
  },

  categoryChip(name, emoji, isActive = false) {
    return `<button class="category-chip ${isActive ? "active" : ""}" data-category="${name}"><span class="chip-emoji">${emoji}</span> ${name}</button>`;
  },

  toast(message, type = "success") {
    const icons = { success: "✅", error: "❌", info: "ℹ️" };
    return `<div class="toast toast-${type}"><span class="toast-icon">${icons[type] || "ℹ️"}</span><span class="toast-msg">${message}</span></div>`;
  },
};
