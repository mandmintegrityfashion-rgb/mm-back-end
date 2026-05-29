import { mongooseConnect } from "@/lib/mongoose";
import { requireAdminSession, withSessionRoute } from "@/lib/session";
import { Staff } from "@/models/Staff";
import bcrypt from "bcryptjs";
import { isValidObjectId } from "mongoose";

const ALLOWED_ROLES = new Set(["staff", "manager"]);

function normalizeString(value) {
  return String(value || "").trim();
}

export default withSessionRoute(async function handler(req, res) {
  requireAdminSession(req);
  await mongooseConnect();

  const id = String(req.query?.id || "").trim();

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid staff ID." });
  }

  if (req.method === "PUT") {
    try {
      const update = {};
      const name = normalizeString(req.body?.name);
      const username = normalizeString(req.body?.username).toLowerCase();
      const password = String(req.body?.password || "");
      const role = normalizeString(req.body?.role).toLowerCase();

      if (name) update.name = name;

      if (username) {
        const existing = await Staff.findOne({ username }).lean();
        if (existing && existing._id.toString() !== id) {
          return res.status(409).json({ error: "Username already taken." });
        }
        update.username = username;
      }

      if (password) {
        if (password.length < 6) {
          return res.status(400).json({ error: "Password must be at least 6 characters." });
        }
        update.password = await bcrypt.hash(password, 12);
      }

      if (role) {
        if (!ALLOWED_ROLES.has(role)) {
          return res.status(400).json({ error: "Invalid role." });
        }
        update.role = role;
      }

      if (req.body?.isActive !== undefined) {
        update.isActive = Boolean(req.body.isActive);
      }

      if (!Object.keys(update).length) {
        return res.status(400).json({ error: "No valid fields provided." });
      }

      const updated = await Staff.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
      }).lean();

      if (!updated) {
        return res.status(404).json({ error: "Staff not found." });
      }

      res.status(200).json(updated);
    } catch (err) {
      console.error("Update failed:", err);
      res.status(500).json({ error: "Server error." });
    }
  } else {
    res.setHeader("Allow", ["PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
});
