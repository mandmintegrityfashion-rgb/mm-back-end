// /models/StockMovement.js
import { Schema, model, models } from "mongoose";

const StockMovementSchema = new Schema(
  {
    transRef: { type: String, required: true },
    fromLocation: { type: String, required: true },
    toLocation: { type: String, required: true },
    staff: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, default: "Received" }, // or "Pending", etc.
    totalCostPrice: { type: Number, default: 0 },
    barcode: { type: String }, // Optional
    dateSent: { type: Date, default: Date.now },
    dateReceived: { type: Date },
    products: [
      {
        id: { type: Schema.Types.ObjectId, ref: "Product" },
        quantity: Number,
      },
    ],
  },
  { timestamps: true }
);

export const StockMovement =
  models.StockMovement || model("StockMovement", StockMovementSchema);
