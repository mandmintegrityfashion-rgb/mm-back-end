// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  pinHash: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
