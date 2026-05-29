import { mongooseConnect } from "@/lib/mongoose";
import Product from "@/models/Product";
import { StockMovement } from "@/models/StockMovement";
import { withSessionRoute } from "@/lib/session";
import mongoose, { isValidObjectId } from "mongoose";
import { randomUUID } from "crypto";

const ALLOWED_REASONS = new Set(["Restock", "Return", "Transfer"]);

function normalizeProducts(products) {
  const productMap = new Map();

  for (const item of products) {
    const id = String(item?.id || "").trim();
    const quantity = Number(item?.quantity);

    if (!isValidObjectId(id) || !Number.isInteger(quantity) || quantity <= 0) {
      const error = new Error("Invalid product format");
      error.statusCode = 400;
      error.details = item;
      throw error;
    }

    const existing = productMap.get(id) || 0;
    productMap.set(id, existing + quantity);
  }

  return Array.from(productMap.entries()).map(([id, quantity]) => ({ id, quantity }));
}

export default withSessionRoute(async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (!req.session?.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!req.session.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  const fromLocation = String(req.body?.fromLocation || "").trim();
  const toLocation = String(req.body?.toLocation || "").trim();
  const staff = String(req.body?.staff || "").trim();
  const reason = String(req.body?.reason || "").trim();
  const rawProducts = Array.isArray(req.body?.products) ? req.body.products : [];

  if (
    !fromLocation ||
    !toLocation ||
    !staff ||
    !reason ||
    rawProducts.length === 0
  ) {
    return res.status(400).json({ message: "Missing or invalid fields" });
  }

  if (!ALLOWED_REASONS.has(reason)) {
    return res.status(400).json({ message: "Invalid stock movement reason" });
  }

  if (fromLocation === toLocation) {
    return res.status(400).json({ message: "Source and destination locations must differ" });
  }

  let session;
  try {
    await mongooseConnect();
    const products = normalizeProducts(rawProducts);
    const isInboundMovement = reason === "Restock";
    let movement;
    let totalCostPrice = 0;

    session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const productIds = products.map(({ id }) => id);
      const productDocs = await Product.find({ _id: { $in: productIds } }).session(session);
      const productById = new Map(productDocs.map((product) => [String(product._id), product]));

      for (const item of products) {
        const product = productById.get(item.id);

        if (!product) {
          const error = new Error("Product not found");
          error.statusCode = 404;
          error.productId = item.id;
          throw error;
        }

        if (!isInboundMovement && product.quantity < item.quantity) {
          const error = new Error(`Insufficient stock for ${product.name}`);
          error.statusCode = 409;
          error.productId = item.id;
          throw error;
        }

        totalCostPrice += (product.costPrice || 0) * item.quantity;
      }

      const transRef = `MOV-${Date.now()}-${randomUUID().slice(0, 8)}`;
      const eventDate = new Date();

      [movement] = await StockMovement.create(
        [
          {
            transRef,
            fromLocation,
            toLocation,
            staff,
            reason,
            status: "Received",
            totalCostPrice,
            dateSent: eventDate,
            dateReceived: eventDate,
            barcode: transRef,
            products,
          },
        ],
        { session }
      );

      const bulkOps = products.map(({ id, quantity }) => ({
        updateOne: {
          filter: isInboundMovement
            ? { _id: id }
            : { _id: id, quantity: { $gte: quantity } },
          update: { $inc: { quantity: isInboundMovement ? quantity : -quantity } },
        },
      }));

      const bulkResult = await Product.bulkWrite(bulkOps, { session });

      if (bulkResult.matchedCount !== products.length) {
        const error = new Error("One or more product stock updates could not be applied");
        error.statusCode = 409;
        throw error;
      }
    });

    return res.status(201).json({
      message: "Stock movement saved and products updated",
      movementId: movement._id,
      transRef: movement.transRef,
    });
  } catch (err) {
    console.error("❗ Error saving stock movement:", err);
    return res.status(err.statusCode || 500).json({
      message: err.message || "Server error",
      error: err.productId || err.details || null,
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
});
