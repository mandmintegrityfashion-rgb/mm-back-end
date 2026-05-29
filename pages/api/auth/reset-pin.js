import bcrypt from "bcryptjs";
import { mongooseConnect } from "@/lib/mongoose";
import User from "@/models/User";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, resetCode, newPin } = req.body;
  if (!email || !resetCode || !newPin) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (newPin.length < 4) {
    return res.status(400).json({ error: "PIN must be at least 4 digits" });
  }

  try {
    await mongooseConnect();

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid request" });

    if (!user.resetCode || !user.resetExpiry) {
      return res.status(400).json({ error: "No reset request found. Please request a new code." });
    }

    if (new Date() > new Date(user.resetExpiry)) {
      user.resetCode = undefined;
      user.resetExpiry = undefined;
      await user.save();
      return res.status(400).json({ error: "Reset code has expired. Please request a new one." });
    }

    if (user.resetCode !== resetCode) {
      return res.status(400).json({ error: "Invalid reset code" });
    }

    // Update PIN
    user.pinHash = await bcrypt.hash(newPin, 10);
    user.resetCode = undefined;
    user.resetExpiry = undefined;
    await user.save();

    return res.json({ ok: true, message: "PIN has been reset successfully!" });
  } catch (err) {
    console.error("Reset PIN error:", err);
    return res.status(err.statusCode || 500).json({
      error: err.publicMessage || "Failed to reset PIN",
    });
  }
}
