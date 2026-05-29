import { mongooseConnect } from "@/lib/mongoose";
import { requireAdminSession, withSessionRoute } from "@/lib/session";
import Hero from "@/models/Hero";

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
  await mongooseConnect();

  try {
    if (req.method === "GET") {
      const heroes = await Hero.find().sort({ order: 1, createdAt: -1 }).lean();
      return res.json(heroes);
    }

    if (req.method === "POST") {
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

      const hero = await Hero.create({ title, subtitle, image, bgImage, ctaText, ctaLink, order, status });
      return res.status(201).json(hero);
    }

    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error("Hero API error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});
