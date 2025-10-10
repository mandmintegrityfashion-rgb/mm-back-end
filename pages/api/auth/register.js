// pages/api/auth/register.js
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "@/models/User";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { username, email, pin } = req.body;
  if (!username || !email || !pin) {
    return res.status(400).json({ error: "Missing fields" });
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    return res.status(400).json({ error: "Username or Email already exists" });
  }

  const pinHash = await bcrypt.hash(pin, 10);

  const user = await User.create({
    username,
    email,
    pinHash,
    isAdmin: username.toLowerCase() === "admin",
  });

  return res.json({ ok: true, user: { username: user.username, email: user.email } });
}
