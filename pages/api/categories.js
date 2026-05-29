import { mongooseConnect } from "@/lib/mongoose";
import { requireAdminSession, withSessionRoute } from "@/lib/session";
import { Category } from "@/models/Category";
import { isValidObjectId } from "mongoose";

function normalizeCategoryImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map((img) => ({
      full: typeof img?.full === "string" ? img.full.trim() : img?.full?.webp || img?.full?.jpeg || "",
      thumb: typeof img?.thumb === "string" ? img.thumb.trim() : img?.thumb?.webp || img?.thumb?.jpeg || "",
    }))
    .filter((img) => img.full && img.thumb);
}

function normalizeProperties(properties) {
  if (!Array.isArray(properties)) {
    return [];
  }

  return properties.filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry));
}

export default withSessionRoute(async function handler(req, res) {
  requireAdminSession(req);
  const { method } = req;
  await mongooseConnect();

  try {
    if (method === "GET") {
      const categories = await Category.find().populate("parent").sort({ createdAt: -1 }).lean();
      return res.json(categories);
    }

    if (method === "POST") {
      const name = String(req.body?.name || "").trim();
      const parentCategory = String(req.body?.parentCategory || "").trim();
      const properties = normalizeProperties(req.body?.properties);
      const images = normalizeCategoryImages(req.body?.images);

      if (!name || !images.length)
        return res.status(400).json({ success: false, message: "Name and at least one image are required" });

      if (parentCategory && !isValidObjectId(parentCategory)) {
        return res.status(400).json({ success: false, message: "Invalid parent category" });
      }

      const category = await Category.create({
        name,
        parent: parentCategory || null,
        properties: properties || [],
        images,
      });

      const populatedCategory = await Category.findById(category._id).populate("parent");
      return res.json(populatedCategory);
    }

    if (method === "PUT") {
      const _id = String(req.body?._id || "").trim();
      const name = String(req.body?.name || "").trim();
      const parentCategory = String(req.body?.parentCategory || "").trim();
      const properties = normalizeProperties(req.body?.properties);
      const images = normalizeCategoryImages(req.body?.images);

      if (!_id) return res.status(400).json({ success: false, message: "Category ID is required" });
      if (!isValidObjectId(_id)) {
        return res.status(400).json({ success: false, message: "Invalid category ID" });
      }

      if (!name || !images.length) {
        return res.status(400).json({ success: false, message: "Name and at least one image are required" });
      }

      if (parentCategory && !isValidObjectId(parentCategory)) {
        return res.status(400).json({ success: false, message: "Invalid parent category" });
      }

      const updatedCategory = await Category.findByIdAndUpdate(
        _id,
        {
          name,
          parent: parentCategory || null,
          properties,
          images,
        },
        { new: true, runValidators: true }
      ).populate("parent");

      if (!updatedCategory) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }

      return res.json(updatedCategory);
    }

    if (method === "DELETE") {
      const id = String(req.query?.id || "").trim();
      if (!id) return res.status(400).json({ success: false, message: "Category ID required" });
      if (!isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: "Invalid category ID" });
      }

      await Category.deleteOne({ _id: id });
      return res.json({ success: true });
    }

    res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error("Category API error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
