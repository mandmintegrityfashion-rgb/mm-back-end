import { mongooseConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method === "GET") {
    const { page = 1, limit = 10, search = "" } = req.query;

    try {
      let query = {};

      if (search) {
        if (mongoose.Types.ObjectId.isValid(search)) {
          // Search directly by Order ID
          query = { _id: search };
        } else {
          // Search by embedded customer fields
          query = {
            $or: [
              { "customer.name": { $regex: search, $options: "i" } },
              { "customer.email": { $regex: search, $options: "i" } },
              { "customer.phone": { $regex: search, $options: "i" } },
            ],
          };
        }
      }

      const total = await Order.countDocuments(query);

      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

      res.status(200).json({
        orders: orders.map((o) => o.toObject()), // returns full customer object
        totalPages: Math.ceil(total / limit),
        total,
      });
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } 
  
  else if (req.method === "PUT") {
    try {
      const { id } = req.query;
      const { status } = req.body;

      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ error: "Order not found" });

      order.status = status;
      await order.save();

      res.status(200).json(order.toObject());
    } catch (error) {
      console.error("Failed to update order:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } 
  
  else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
