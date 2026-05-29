import { mongooseConnect } from "@/lib/mongoose";
import { requireAdminSession, withSessionRoute } from "@/lib/session";
import Order from "@/models/Order";
import mongoose from "mongoose";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default withSessionRoute(async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  requireAdminSession(req);
  await mongooseConnect();

  const page = Math.max(Number(req.query?.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query?.limit) || 10, 1), 100);
  const search = String(req.query?.search || "").trim();

  try {
    let query = {};

    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        query = { _id: search };
      } else {
        const searchRegex = new RegExp(escapeRegex(search), "i");
        query = {
          $or: [
            { "shippingDetails.name": searchRegex },
            { "shippingDetails.email": searchRegex },
            { "shippingDetails.phone": searchRegex },
          ],
        };
      }
    }

    const total = await Order.countDocuments(query);
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    const orders = await Order.find(query)
      .populate("customer")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.status(200).json({
      orders,
      totalPages,
      total,
    });
  } catch (error) {
    console.error("❌ Failed to fetch orders:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
