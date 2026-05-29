// pages/api/auth/register.js
import bcrypt from "bcryptjs";
import { mongooseConnect } from "@/lib/mongoose";
import User from "@/models/User";
import { withSessionRoute } from "@/lib/session";

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default withSessionRoute(async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const username = normalizeUsername(req.body?.username);
  const email = String(req.body?.email || "").trim().toLowerCase();
  const pin = String(req.body?.pin || "").trim();
  const requestedAdmin = Boolean(req.body?.isAdmin);

  if (!username || !email || !pin) {
    return res.status(400).json({ error: "Missing fields" });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }

  if (!/^\d{4,8}$/.test(pin)) {
    return res.status(400).json({ error: "PIN must be 4 to 8 digits" });
  }

  await mongooseConnect();

  const userCount = await User.countDocuments();
  const isBootstrapRegistration = userCount === 0;

  if (!isBootstrapRegistration && !req.session?.user?.isAdmin) {
    return res.status(403).json({ error: "New accounts must be created by an administrator" });
  }

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    return res.status(400).json({ error: "Username or Email already exists" });
  }

  const pinHash = await bcrypt.hash(pin, 12);
  const isAdmin = isBootstrapRegistration ? true : req.session.user.isAdmin && requestedAdmin;

  const user = await User.create({
    username,
    email,
    pinHash,
    isAdmin,
  });

  return res.json({
    ok: true,
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
    },
  });
});
