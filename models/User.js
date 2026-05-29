// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true, trim: true },
    email: { type: String, unique: true, required: true, trim: true, lowercase: true },
    pinHash: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    resetCode: { type: String },
    resetExpiry: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
