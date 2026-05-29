import { mongooseConnect } from "@/lib/mongoose";
import { requireAdminSession, withSessionRoute } from "@/lib/session";
import { Staff } from "@/models/Staff";
import bcrypt from "bcryptjs";

const ALLOWED_ROLES = new Set(["staff", "manager"]);

function normalizeString(value) {
  return String(value || "").trim();
}

export default withSessionRoute(async function handler(req, res) {
  try {
    requireAdminSession(req);

    await mongooseConnect();
  } catch (err) {
    console.error("MongoDB connection error:", err);
    return res.status(err.statusCode || 500).json({ error: "Failed to connect to DB", details: err.message });
  }

  if (req.method === "GET") {
    try {
      const staff = await Staff.find().sort({ name: 1 }).lean();
      return res.status(200).json(staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      return res.status(500).json({ error: "Failed to fetch staff", details: error.message });
    }
  }

  if (req.method === "POST") {
    const name = normalizeString(req.body?.name);
    const username = normalizeString(req.body?.username).toLowerCase();
    const password = String(req.body?.password || "");
    const role = normalizeString(req.body?.role || "staff").toLowerCase();

    if (!name || !username || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    if (!ALLOWED_ROLES.has(role)) {
      return res.status(400).json({ error: "Invalid staff role" });
    }

    try {
      const existingStaff = await Staff.findOne({ username }).lean();
      if (existingStaff) {
        return res.status(409).json({ error: "Username already taken." });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const staff = await Staff.create({
        name,
        username,
        password: hashedPassword,
        role,
      });

      const safeStaff = await Staff.findById(staff._id).lean();
      return res.status(201).json(safeStaff);
    } catch (error) {
      console.error("Error creating staff:", error);
      return res.status(500).json({ error: "Error creating staff", details: error.message });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
});
