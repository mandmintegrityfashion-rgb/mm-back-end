import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    category: { type: String, trim: true },
    description: { type: String, trim: true },
    images: [String],
  },
  { _id: false }
);

const deliveryPersonSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    shippingDetails: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
    },

    items: { type: [orderItemSchema], default: [] },
    cartProducts: { type: [orderItemSchema], default: [] },

    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    total: { type: Number, required: true },

    paymentReference: { type: String },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },

    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },

    deliveryPerson: deliveryPersonSchema,
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    fulfilledAt: { type: Date },
    inventoryCommittedAt: { type: Date },
    paid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ customer: 1, createdAt: -1 });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
