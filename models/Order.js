import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    items: [
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true},
    price: { type: Number, required: true },
    name: String,
    category: String,
    description: String,
    images: [String],
  },
],

    subtotal: Number,
    shippingCost: Number,
    total: Number,
    status: { type: String, default: "Pending" },
    paid: { type: Boolean, default: false },
    paymentReference: { type: String },
    paymentStatus: { type: String, default: "Pending" },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
