import { mongooseConnect } from "@/lib/mongoose";
import { requireAdminSession, withSessionRoute } from "@/lib/session";
import Order from "@/models/Order";

export default withSessionRoute(async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  requireAdminSession(req);
  await mongooseConnect();

  try {
    const newOrders = await Order.find({ status: "Pending" })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("_id createdAt shippingDetails customer")
      .lean();

    const formatted = newOrders.map((o) => ({
      _id: o._id,
      customerName:
        o.shippingDetails?.name || o.customer?.name || "Online Customer",
      createdAt: o.createdAt,
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error("Failed to fetch new orders:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
