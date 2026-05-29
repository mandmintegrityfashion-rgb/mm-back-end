import mongoose, { isValidObjectId } from "mongoose";
import { mongooseConnect } from "@/lib/mongoose";
import { requireAdminSession, withSessionRoute } from "@/lib/session";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { Transaction } from "@/models/Transactions";

const STATUS_TRANSITIONS = {
  Pending: new Set(["Pending", "Processing", "Shipped", "Cancelled"]),
  Processing: new Set(["Processing", "Shipped", "Delivered", "Cancelled"]),
  Shipped: new Set(["Shipped", "Delivered", "Cancelled"]),
  Delivered: new Set(["Delivered"]),
  Cancelled: new Set(["Cancelled"]),
};

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeDeliveryPerson(deliveryPerson) {
  if (!deliveryPerson) {
    return undefined;
  }

  const name = String(deliveryPerson.name || "").trim();
  const phone = String(deliveryPerson.phone || "").trim();

  if (!name || !phone) {
    throw createHttpError(400, "Delivery person name and phone are required");
  }

  return { name, phone };
}

function getGroupedOrderItems(order) {
  const sourceItems =
    Array.isArray(order.cartProducts) && order.cartProducts.length > 0
      ? order.cartProducts
      : Array.isArray(order.items)
      ? order.items
      : [];

  if (!sourceItems.length) {
    throw createHttpError(400, "Order has no items to fulfill");
  }

  const itemMap = new Map();

  for (const item of sourceItems) {
    if (!item?.productId || !isValidObjectId(item.productId)) {
      throw createHttpError(400, "Order contains an invalid product reference");
    }

    const qty = Number(item.quantity || 0);
    const salePriceIncTax = Number(item.price || 0);

    if (!Number.isFinite(qty) || qty <= 0) {
      throw createHttpError(400, "Order contains an invalid quantity");
    }

    if (!Number.isFinite(salePriceIncTax) || salePriceIncTax < 0) {
      throw createHttpError(400, "Order contains an invalid sale price");
    }

    const productId = String(item.productId);
    const existing = itemMap.get(productId);

    if (existing) {
      existing.qty += qty;
      continue;
    }

    itemMap.set(productId, {
      productId,
      name: String(item.name || "").trim() || "Unnamed Product",
      qty,
      salePriceIncTax,
    });
  }

  return Array.from(itemMap.values());
}

export default withSessionRoute(async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    requireAdminSession(req);
    await mongooseConnect();

    const id = String(req.query?.id || "").trim();
    const status = String(req.body?.status || "").trim();
    const deliveryPerson = normalizeDeliveryPerson(req.body?.deliveryPerson);

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    if (!Object.prototype.hasOwnProperty.call(STATUS_TRANSITIONS, status)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    let session;
    let updatedOrder;

    try {
      session = await mongoose.startSession();

      await session.withTransaction(async () => {
        const order = await Order.findById(id).populate("customer").session(session);
        if (!order) {
          throw createHttpError(404, "Order not found");
        }

        if (!STATUS_TRANSITIONS[order.status]?.has(status)) {
          throw createHttpError(409, `Cannot change order from ${order.status} to ${status}`);
        }

        if ((status === "Shipped" || status === "Delivered") && !deliveryPerson && !order.deliveryPerson) {
          throw createHttpError(400, "Delivery person details are required for shipped or delivered orders");
        }

        if (deliveryPerson && (status === "Shipped" || status === "Delivered")) {
          order.deliveryPerson = deliveryPerson;
        }

        if (status === "Delivered" && !order.inventoryCommittedAt) {
          const items = getGroupedOrderItems(order);
          const now = new Date();
          const productDocs = await Product.find({
            _id: { $in: items.map((item) => item.productId) },
          })
            .select("_id name quantity")
            .session(session);

          const productMap = new Map(productDocs.map((product) => [String(product._id), product]));

          const stockUpdates = items.map((item) => {
            const product = productMap.get(item.productId);
            if (!product) {
              throw createHttpError(404, `Product not found for fulfillment: ${item.name}`);
            }

            if (product.quantity < item.qty) {
              throw createHttpError(409, `Insufficient stock for ${product.name}`);
            }

            return {
              updateOne: {
                filter: { _id: item.productId, quantity: { $gte: item.qty } },
                update: {
                  $inc: {
                    quantity: -item.qty,
                    totalUnitsSold: item.qty,
                    totalRevenue: item.salePriceIncTax * item.qty,
                  },
                  $set: { lastSoldAt: now },
                  $push: {
                    salesHistory: {
                      orderId: order._id,
                      quantity: item.qty,
                      salePrice: item.salePriceIncTax,
                      soldAt: now,
                    },
                  },
                },
              },
            };
          });

          const bulkResult = await Product.bulkWrite(stockUpdates, { session });
          if (bulkResult.matchedCount !== items.length) {
            throw createHttpError(409, "Unable to apply one or more stock updates");
          }

          if (!order.transactionId) {
            const [transaction] = await Transaction.create(
              [
                {
                  orderId: order._id,
                  tenderType: "Online",
                  amountPaid: order.total,
                  total: order.total,
                  staff: "Online User",
                  location: "Web",
                  device: "Web",
                  discount: 0,
                  discountReason: "",
                  customerName:
                    order.shippingDetails?.name || order.customer?.name || "Online Customer",
                  transactionType: "WEB",
                  change: 0,
                  items,
                },
              ],
              { session }
            );

            order.transactionId = transaction._id;
          }

          order.inventoryCommittedAt = now;
          order.fulfilledAt = now;
        }

        order.status = status;
        await order.save({ session });
        updatedOrder = order.toObject();
      });
    } finally {
      if (session) {
        await session.endSession();
      }
    }

    return res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("❌ Order update failed:", error);
    return res.status(error.statusCode || 500).json({
      error: error.message || "Internal Server Error",
    });
  }
});
