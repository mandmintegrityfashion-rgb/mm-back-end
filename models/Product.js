// models/Product.js
import { model, Schema, models } from "mongoose";

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    costPrice: { type: Number, required: true },
    taxRate: { type: Number, default: 0 },
    salePriceIncTax: { type: Number, required: true },
    margin: { type: Number, default: 0 },
    barcode: { type: String },
    category: { type: String, default: "Top Level" },

    // Images now store full and thumb URLs
    images: [
      {
        full: { type: String, required: true },
        thumb: { type: String, required: true },
      },
    ],

    properties: [{ type: Object }],
    quantity: { type: Number, default: 0 },
    minStock: { type: Number, default: 0 },
    maxStock: { type: Number, default: 0 },

   
    isPromotion: { type: Boolean, default: false },
    promoPrice: { type: Number }, 
    promoStart: { type: Date },
    promoEnd: { type: Date },

    
    totalUnitsSold: { type: Number, default: 0 },      
    totalRevenue: { type: Number, default: 0 },         
    lastSoldAt: { type: Date },                         
    salesHistory: [
      {
        orderId: { type: Schema.Types.ObjectId, ref: "Order" },
        quantity: { type: Number, required: true },
        salePrice: { type: Number, required: true },    
        soldAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Product = models.Product || model("Product", ProductSchema);
