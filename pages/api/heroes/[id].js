// pages/api/heroes/[id].js
import { mongooseConnect } from "@/lib/mongoose";
import { requireAdminSession, withSessionRoute } from "@/lib/session";
import Hero from "@/models/Hero";
import { isValidObjectId } from "mongoose";

function normalizeImageSet(images, required) {
  const normalized = Array.isArray(images)
    ? images
        .map((image) => ({
          full: String(image?.full || "").trim(),
          thumb: String(image?.thumb || "").trim(),
        }))
        .filter((image) => image.full && image.thumb)
    : [];

  if (required && !normalized.length) {
    throw new Error("Title and at least one Hero Image (full + thumb) are required");
  }

  return normalized;
}

export default withSessionRoute(async function handler(req, res) {
  requireAdminSession(req);
  await mongooseConnect(); // ✅ ensure DB connection

  const id = String(req.query?.id || "").trim();

  if (!id || !isValidObjectId(id)) {
    return res.status(400).json({ error: "Hero ID is required" });
  }

  try {
    if (req.method === "GET") {
      const hero = await Hero.findById(id);
      if (!hero) return res.status(404).json({ error: "Hero not found" });
      return res.json(hero);
    }

    if (req.method === "PUT") {
      const title = String(req.body?.title || "").trim();
      const subtitle = String(req.body?.subtitle || "").trim();
      const image = normalizeImageSet(req.body?.image, true);
      const bgImage = normalizeImageSet(req.body?.bgImage, false);
      const ctaText = String(req.body?.ctaText || "").trim();
      const ctaLink = String(req.body?.ctaLink || "").trim();
      const order = Number(req.body?.order || 0);
      const status = String(req.body?.status || "active").trim() || "active";

      if (!title) {
        return res.status(400).json({ error: "Title and at least one Hero Image (full + thumb) are required" });
      }

      const updated = await Hero.findByIdAndUpdate(
        id,
        { title, subtitle, image, bgImage, ctaText, ctaLink, order, status },
        { new: true, runValidators: true }
      );

      if (!updated) return res.status(404).json({ error: "Hero not found" });
      return res.json(updated);
    }

    if (req.method === "DELETE") {
      const deleted = await Hero.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: "Hero not found" });
      return res.json({ message: "Hero deleted successfully" });
    }

    // Method not allowed
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error("Hero API error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});
