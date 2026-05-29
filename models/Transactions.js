import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, trim: true },
    salePriceIncTax: { type: Number, min: 0 },
    qty: { type: Number, min: 1 },
  },
  { _id: false }
);

const TransactionSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", index: true },
    tenderType: { type: String, trim: true },
    amountPaid: { type: Number, min: 0 },
    total: { type: Number, min: 0 },
    staff: { type: String, default: "Online User", trim: true },
    location: { type: String, trim: true },
    device: { type: String, trim: true },
    tableName: { type: String, trim: true },
    discount: { type: Number, default: 0, min: 0 },
    discountReason: { type: String, trim: true },
    customerName: { type: String, trim: true },
    transactionType: { type: String, trim: true },
    change: { type: Number, default: 0, min: 0 },
    items: {
      type: [itemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Transaction =
  mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);

export { Transaction };
