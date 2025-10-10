// models/Transactions.js

import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    salePriceIncTax: Number,
    qty: Number,
  },
  { _id: false } // don't auto-generate _id for subdocs
);

const TransactionSchema = new mongoose.Schema({
  tenderType: String,
  amountPaid: Number,
  total: Number,
  staff: { type: String, default: "Online User" },
location: String,
  device: String,
  tableName: String,
  discount: Number,
  discountReason: String,
  customerName: String,
  transactionType: String, // POS or WEB
  change: Number,
  items: {
    type: [itemSchema],
    default: [],
  },
  createdAt: { type: Date, default: Date.now },
});

delete mongoose.models.Transaction;
const Transaction = mongoose.model("Transaction", TransactionSchema);

export { Transaction };
