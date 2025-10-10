import mongoose, { Schema, models } from "mongoose";

const HeroSchema = new Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  image: { type: String, required: true }, // always store uploaded image URL
});

const AdminSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
});

const SalesSchema = new Schema({
  currency: { type: String, default: "NGN" },
  taxRate: { type: Number, default: 0 }, // %
  allowDiscounts: { type: Boolean, default: true },
  paymentMethods: [{ type: String }], // e.g. ["Cash", "Card", "Transfer"]
});

const SetupSchema = new Schema(
  {
    // Store Info
    storeName: { type: String, required: true },
    storePhone: { type: String },
    country: { type: String },
    locations: [{ type: String }],
    currency: { type: String, default: "NGN" },
    logo: { type: String },

    // Admin list
    admins: [AdminSchema],

    // Sales management
    sales: SalesSchema,

    // Hero section
    heroPages: [HeroSchema],
  },
  { timestamps: true }
);

export const Setup = models?.Setup || mongoose.model("Setup", SetupSchema);
