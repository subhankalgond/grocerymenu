// ──────────────────────────────────────────────
//  FreshCart — Order Model (MongoDB/Mongoose)
// ──────────────────────────────────────────────

const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    name: String,
    emoji: String,
    price: Number,
    unit: String,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotal: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: Number,
      unique: true,
    },
    items: [orderItemSchema],
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "delivered", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    customer: {
      name: { type: String, required: true },
      email: { type: String, default: "" },
      phone: { type: String, required: true },
      address: { type: String, required: true },
    },
    isNewOrder: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-increment orderId
orderSchema.pre("save", async function (next) {
  if (!this.orderId) {
    const lastOrder = await this.constructor
      .findOne({}, {}, { sort: { orderId: -1 } });
    this.orderId = lastOrder ? lastOrder.orderId + 1 : 1001;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
