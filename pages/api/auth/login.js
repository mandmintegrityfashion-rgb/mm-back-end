import bcrypt from "bcryptjs";
import { mongooseConnect } from "@/lib/mongoose";
import User from "@/models/User";
import { withSessionRoute } from "@/lib/session";

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default withSessionRoute(async function loginRoute(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const username = normalizeUsername(req.body?.username);
    const pin = String(req.body?.pin || "").trim();

    if (!username || !pin) {
      return res.status(400).json({ error: "Username and PIN are required" });
    }

    await mongooseConnect();

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: "Invalid username or pin" });

    const valid = await bcrypt.compare(pin, user.pinHash);
    if (!valid) return res.status(401).json({ error: "Invalid username or pin" });

    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      name: user.username,
    };
    await req.session.save();

    res.json({ ok: true, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({
      error: err.publicMessage || "Internal server error",
    });
  }
});
