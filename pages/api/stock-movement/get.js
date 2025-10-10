// /pages/api/stock-movement/get.js

import { mongooseConnect } from "@/lib/mongoose";
import { StockMovement } from "@/models/StockMovement";
import { Product } from "@/models/Product";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const data = await StockMovement.find({})
        .sort({ createdAt: -1 })
        .populate("products.id");

      const movements = data.map((m) => {
        const totalCostPrice = m.products.reduce((sum, p) => {
          const cost = p.id?.costPrice || 0;
          return sum + cost * p.quantity;
        }, 0);

        return {
          _id: m._id,
          transRef: m.transRef, // if you're storing it, otherwise generate here
          sender: m.fromLocation,
          receiver: m.toLocation,
          reason: m.reason,
          staff: m.staff,
          dateSent: m.createdAt,
          dateReceived: m.updatedAt,
          totalCostPrice,
          status: m.status || "Received",
          barcode: m.barcode || "",
        };
      });

      return res.status(200).json(movements);
    } catch (error) {
      console.error("Fetch stock movement failed:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}
