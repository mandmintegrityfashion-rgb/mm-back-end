import mongoose, { Schema, models } from "mongoose";

const SalesProductSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    image: { type: String },
    category: { type: String },
  },
  { timestamps: true }
);

export const SalesProduct =
  models?.SalesProduct || mongoose.model("SalesProduct", SalesProductSchema);
