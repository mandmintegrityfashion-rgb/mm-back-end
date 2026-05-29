import { isValidObjectId } from "mongoose";
import { mongooseConnect } from "@/lib/mongoose";
import { requireAdminSession, withSessionRoute } from "@/lib/session";
import Product from "@/models/Product";

const NUMBER_RULES = {
  costPrice: { min: 0 },
  taxRate: { min: 0, max: 100 },
  salePriceIncTax: { min: 0 },
  margin: { min: 0 },
  quantity: { min: 0, integer: true },
  minStock: { min: 0, integer: true },
  maxStock: { min: 0, integer: true },
  promoPrice: { min: 0, nullable: true },
};

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toTitleCase(value) {
  return String(value || "")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeString(value, fieldName, { required = false, defaultValue = undefined } = {}) {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = String(value || "").trim();
  if (required && !normalized) {
    throw createHttpError(400, `${fieldName} is required`);
  }

  return normalized;
}

function normalizeNumber(value, fieldName, rules = {}) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    if (rules.nullable) {
      return null;
    }

    throw createHttpError(400, `${fieldName} is required`);
  }

  const normalized = Number(value);
  if (!Number.isFinite(normalized)) {
    throw createHttpError(400, `${fieldName} must be a valid number`);
  }

  if (rules.integer && !Number.isInteger(normalized)) {
    throw createHttpError(400, `${fieldName} must be a whole number`);
  }

  if (rules.min !== undefined && normalized < rules.min) {
    throw createHttpError(400, `${fieldName} must be at least ${rules.min}`);
  }

  if (rules.max !== undefined && normalized > rules.max) {
    throw createHttpError(400, `${fieldName} must not exceed ${rules.max}`);
  }

  return normalized;
}

function normalizeDate(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createHttpError(400, `${fieldName} must be a valid date`);
  }

  return date;
}

function normalizeBoolean(value, defaultValue = false) {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return Boolean(value);
}

function normalizeImages(images) {
  if (images === undefined) {
    return undefined;
  }

  if (!Array.isArray(images)) {
    throw createHttpError(400, "Images must be an array");
  }

  return images.map((image, index) => {
    const full = normalizeString(image?.full, `images[${index}].full`, { required: true });
    const thumb = normalizeString(image?.thumb, `images[${index}].thumb`, { required: true });
    return { full, thumb };
  });
}

function normalizeProperties(properties) {
  if (properties === undefined) {
    return undefined;
  }

  if (!Array.isArray(properties)) {
    throw createHttpError(400, "Properties must be an array");
  }

  return properties
    .filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry))
    .map((entry) =>
      Object.fromEntries(
        Object.entries(entry).filter(([, value]) => value !== undefined && value !== null && `${value}`.trim() !== "")
      )
    )
    .filter((entry) => Object.keys(entry).length > 0);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildProductPayload(payload, existingProduct) {
  const existing = existingProduct || {};
  const nextProduct = {
    name: hasOwn(payload, "name") ? toTitleCase(payload.name) : existing.name,
    description: hasOwn(payload, "description")
      ? normalizeString(payload.description, "Description", { required: true })
      : existing.description,
    costPrice: hasOwn(payload, "costPrice")
      ? normalizeNumber(payload.costPrice, "Cost price", NUMBER_RULES.costPrice)
      : existing.costPrice,
    taxRate: hasOwn(payload, "taxRate")
      ? normalizeNumber(payload.taxRate, "Tax rate", NUMBER_RULES.taxRate)
      : existing.taxRate ?? 0,
    salePriceIncTax: hasOwn(payload, "salePriceIncTax")
      ? normalizeNumber(payload.salePriceIncTax, "Sale price", NUMBER_RULES.salePriceIncTax)
      : existing.salePriceIncTax,
    margin: hasOwn(payload, "margin")
      ? normalizeNumber(payload.margin, "Margin", NUMBER_RULES.margin)
      : existing.margin ?? 0,
    barcode: hasOwn(payload, "barcode")
      ? normalizeString(payload.barcode, "Barcode") || null
      : existing.barcode || null,
    category: hasOwn(payload, "category")
      ? normalizeString(payload.category, "Category") || "Top Level"
      : existing.category || "Top Level",
    images: hasOwn(payload, "images") ? normalizeImages(payload.images) : existing.images || [],
    properties: hasOwn(payload, "properties")
      ? normalizeProperties(payload.properties)
      : existing.properties || [],
    quantity: hasOwn(payload, "quantity")
      ? normalizeNumber(payload.quantity, "Quantity", NUMBER_RULES.quantity)
      : existing.quantity ?? 0,
    minStock: hasOwn(payload, "minStock")
      ? normalizeNumber(payload.minStock, "Minimum stock", NUMBER_RULES.minStock)
      : existing.minStock ?? 0,
    maxStock: hasOwn(payload, "maxStock")
      ? normalizeNumber(payload.maxStock, "Maximum stock", NUMBER_RULES.maxStock)
      : existing.maxStock ?? 0,
    isPromotion: hasOwn(payload, "isPromotion")
      ? normalizeBoolean(payload.isPromotion)
      : existing.isPromotion ?? false,
    promoPrice: hasOwn(payload, "promoPrice")
      ? normalizeNumber(payload.promoPrice, "Promo price", NUMBER_RULES.promoPrice)
      : existing.promoPrice ?? null,
    promoStart: hasOwn(payload, "promoStart")
      ? normalizeDate(payload.promoStart, "Promotion start")
      : existing.promoStart ?? null,
    promoEnd: hasOwn(payload, "promoEnd")
      ? normalizeDate(payload.promoEnd, "Promotion end")
      : existing.promoEnd ?? null,
  };

  if (!nextProduct.name) {
    throw createHttpError(400, "Name is required");
  }

  if (!nextProduct.description) {
    throw createHttpError(400, "Description is required");
  }

  if (nextProduct.maxStock < nextProduct.minStock) {
    throw createHttpError(400, "Maximum stock must be greater than or equal to minimum stock");
  }

  if (nextProduct.isPromotion) {
    if (nextProduct.promoPrice === null || nextProduct.promoPrice === undefined) {
      throw createHttpError(400, "Promo price is required when promotion is enabled");
    }

    if (nextProduct.promoPrice > nextProduct.salePriceIncTax) {
      throw createHttpError(400, "Promo price cannot exceed the sale price");
    }

    if (nextProduct.promoStart && nextProduct.promoEnd && nextProduct.promoEnd < nextProduct.promoStart) {
      throw createHttpError(400, "Promotion end date must be after the start date");
    }
  } else {
    nextProduct.promoPrice = null;
    nextProduct.promoStart = null;
    nextProduct.promoEnd = null;
  }

  return nextProduct;
}

export default withSessionRoute(async function handler(req, res) {
  const { method } = req;
  await mongooseConnect();

  try {
    if (method !== "GET") {
      requireAdminSession(req);
    }

    if (method === "GET") {
      const id = String(req.query?.id || "").trim();
      const search = String(req.query?.search || "").trim();

      if (id) {
        if (!isValidObjectId(id)) {
          return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const product = await Product.findById(id).lean();
        if (!product) {
          return res.status(404).json({ success: false, message: "Product not found" });
        }

        return res.json(product);
      }

      if (search) {
        const searchRegex = new RegExp(escapeRegex(search), "i");
        const products = await Product.find({
          $or: [{ name: searchRegex }, { barcode: searchRegex }],
        })
          .sort({ updatedAt: -1 })
          .limit(20)
          .lean();

        return res.json({ success: true, data: products, products });
      }

      const products = await Product.find().sort({ updatedAt: -1 }).lean();
      return res.json({ success: true, data: products, products });
    }

    if (method === "POST") {
      const productDoc = await Product.create(buildProductPayload(req.body || {}, null));

      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: productDoc,
      });
    }

    if (method === "PUT") {
      const id = String(req.body?._id || "").trim();
      if (!id) {
        return res.status(400).json({ success: false, message: "Product ID required" });
      }

      if (!isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }

      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      const nextProduct = buildProductPayload(req.body || {}, existingProduct.toObject());
      const updated = await Product.findByIdAndUpdate(id, nextProduct, {
        new: true,
        runValidators: true,
      });

      return res.json({
        success: true,
        message: "Product updated successfully",
        data: updated,
      });
    }

    if (method === "DELETE") {
      const id = String(req.query?.id || "").trim();

      if (!id) {
        return res.status(400).json({ success: false, message: "Product ID required" });
      }

      if (!isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }

      const product = await Product.findById(id).select("quantity totalUnitsSold");
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      if (product.quantity > 0 || product.totalUnitsSold > 0) {
        return res.status(409).json({
          success: false,
          message: "Products with stock or sales history cannot be deleted",
        });
      }

      await Product.findByIdAndDelete(id);

      return res.json({
        success: true,
        message: "Product deleted successfully",
      });
    }

    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`,
    });
  } catch (error) {
    console.error("Error in Product API:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Server error, please try again",
    });
  }
});
