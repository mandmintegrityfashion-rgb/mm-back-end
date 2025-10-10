import { mongooseConnect } from "@/lib/mongoose";
import { Staff } from "@/models/Staff";

export default async function handler(req, res) {
  await mongooseConnect();

  const { id } = req.query;

  if (req.method === "PUT") {
    try {
      const { name, username, password, role, isActive } = req.body;

      // Check if the new username already exists (and isn't the current document)
      const existing = await Staff.findOne({ username });
      if (existing && existing._id.toString() !== id) {
        return res.status(400).json({ error: "Username already taken." });
      }

      const updated = await Staff.findByIdAndUpdate(
        id,
        { name, username, password, role, isActive },
        { new: true }
      );

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
}
