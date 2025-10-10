import mongoose, { Schema, models } from "mongoose";

// Cart item sub-schema
const cartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

// Wishlist item sub-schema
const wishlistItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Address sub-schema
const addressSchema = new Schema(
  {
    label: { type: String, default: "Home" }, // Home, Work, etc.
    recipientName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String, default: "Nigeria" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

// Customer schema
const customerSchema = new Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, unique: true, required: true, lowercase: true },
    phone: { type: String },
    password: { type: String, required: true },
    avatar: { type: String },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpiry: { type: Date },

    // E-commerce fields
    cart: [cartItemSchema],
    wishlist: [wishlistItemSchema],
    addresses: [addressSchema],
    newsletterSubscribed: { type: Boolean, default: true },
    storeCredit: { type: Number, default: 0 },

    // Reference orders
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
  },
  { timestamps: true }
);

const Customer = models.Customer || mongoose.model("Customer", customerSchema);
export default Customer;
