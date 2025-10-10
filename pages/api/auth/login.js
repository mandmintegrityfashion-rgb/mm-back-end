import bcrypt from "bcryptjs";
import { mongooseConnect } from "@/lib/mongoose";
import User from "@/models/User";
import { withSessionRoute } from "@/lib/session";

export default withSessionRoute(async function loginRoute(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { username, pin } = req.body; 
    await mongooseConnect();

    // --- Auto Admin Login ---
    if (username === "admin" && pin === "1234") {
      req.session.user = { 
        id: "admin-id", 
        username: "admin", 
        email: "admin@example.com", // optional placeholder
        isAdmin: true, 
        name: "Admin" 
      };
      await req.session.save();
      return res.json({ ok: true, user: req.session.user });
    }

    // --- Normal User Login ---
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: "Invalid username or pin" });

    const valid = await bcrypt.compare(pin, user.pinHash);
    if (!valid) return res.status(401).json({ error: "Invalid username or pin" });

    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email, // still stored in session if needed
      isAdmin: user.isAdmin,
      name: user.username,
    };
    await req.session.save();

    res.json({ ok: true, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
