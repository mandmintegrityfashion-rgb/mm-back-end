// models/Store.js
import mongoose from "mongoose";

const StoreSchema = new mongoose.Schema(
  {
    companyName: String,
    email: String,
    logo: String,
    currency: String,
    timezone: String,
    locations: [String],
    devices: [String],
    orderFooter: String,
    openingHours: [{ day: String, open: String, close: String }],
    tenderTypes: [String],
    taxRates: [{ name: String, percentage: Number }],
    pettyCashReasons: [String],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    storeName: { type: String, required: true },
    storePhone: { type: String, required: true },
    country: { type: String, required: true },
    locations: [{ type: String }], // Array of strings for multiple locations
    featuredProductId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  },
  { timestamps: true }
);

export default mongoose.models.Store || mongoose.model("Store", StoreSchema);
