import mongoose, { Schema, models } from "mongoose";

const StaffSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Staff name is required"],
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      required: [true, "Username is required"],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      // In production, always hash this before saving
    },
    role: {
      type: String,
      enum: ["staff", "manager"],
      default: "staff",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Avoid model overwrite errors in dev
export const Staff = models.Staff || mongoose.model("Staff", StaffSchema);
