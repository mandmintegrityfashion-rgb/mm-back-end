import { mongooseConnect } from "@/lib/mongoose";
import { StockMovement } from "@/models/StockMovement";
import mongoose from "mongoose"; // add this

export default async function handler(req, res) {
  await mongooseConnect();

  const { id } = req.query;

  if (req.method === "GET") {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const movement = await StockMovement.findById(id).populate("products.id");

      if (!movement) {
        return res.status(404).json({ message: "Movement not found" });
      }

      const totalCostPrice = movement.products.reduce((sum, p) => {
        const cost = p.id?.costPrice || 0;
        return sum + cost * p.quantity;
      }, 0);

      return res.status(200).json({
        _id: movement._id,
        transRef: movement._id.toString().slice(-4).padStart(4, "0"),
        fromLocation: movement.fromLocation,
        toLocation: movement.toLocation,
        reason: movement.reason,
        staff: movement.staff,
        dateSent: movement.createdAt,
        dateReceived: movement.updatedAt,
        status: "Received",
        totalCostPrice,
        products: movement.products,
      });
    } catch (err) {
      console.error("Server error:", err);
      return res.status(500).json({ message: "Server error", details: err.message });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
