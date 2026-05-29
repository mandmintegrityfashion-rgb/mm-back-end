import { model, Schema, models } from "mongoose";

const imageSchema = new Schema(
  {
    full: { type: String, required: true, trim: true },
    thumb: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const salesHistorySchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    quantity: { type: Number, required: true, min: 1 },
    salePrice: { type: Number, required: true, min: 0 },
    soldAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    costPrice: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    salePriceIncTax: { type: Number, required: true, min: 0 },
    margin: { type: Number, default: 0, min: 0 },
    barcode: { type: String, trim: true },
    category: { type: String, default: "Top Level", trim: true },
    images: { type: [imageSchema], default: [] },
    properties: { type: [Schema.Types.Mixed], default: [] },
    quantity: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 0, min: 0 },
    maxStock: { type: Number, default: 0, min: 0 },
    isPromotion: { type: Boolean, default: false },
    promoPrice: { type: Number, min: 0, default: null },
    promoStart: { type: Date, default: null },
    promoEnd: { type: Date, default: null },
    totalUnitsSold: { type: Number, default: 0, min: 0 },
    totalRevenue: { type: Number, default: 0, min: 0 },
    lastSoldAt: { type: Date },
    salesHistory: { type: [salesHistorySchema], default: [] },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 1 });
ProductSchema.index({ barcode: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ quantity: 1 });

export default models.Product || model("Product", ProductSchema);
