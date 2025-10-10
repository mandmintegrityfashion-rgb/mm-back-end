import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { StockMovement } from "@/models/StockMovement";
import { isValidObjectId } from "mongoose";


export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { fromLocation, toLocation, staff, reason, products } = req.body;

  if (
    !fromLocation ||
    !toLocation ||
    !staff ||
    !reason ||
    !Array.isArray(products) ||
    products.length === 0
  ) {
    return res.status(400).json({ message: "Missing or invalid fields" });
  }

  try {
    await mongooseConnect();

    // Calculate total cost price
    let totalCostPrice = 0;

    for (const item of products) {
      const { id, quantity } = item;

      if (!isValidObjectId(id) || typeof quantity !== "number") {
        return res.status(400).json({ message: `Invalid product format`, product: item });
      }

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: `Product not found`, id });
      }

      totalCostPrice += (product.costPrice || 0) * quantity;
    }

    const transRef = Date.now().toString(); // Or use uuid
    const status = "Received"; // Default — later you can support "Pending"
    const dateSent = new Date();

    // Save movement entry
    const movement = await StockMovement.create({
      transRef,
      fromLocation,
      toLocation,
      staff,
      reason,
      status,
      totalCostPrice,
      dateSent,
      dateReceived: dateSent,
      barcode: transRef, // Can be used as barcode
      products,
    });

    // Update product quantities
    const bulkOps = products.map(({ id, quantity }) => {
      let qtyChange = 0;
      if (reason === "Restock") qtyChange = quantity;
      else if (reason === "Return" || reason === "Transfer") qtyChange = -quantity;

      return {
        updateOne: {
          filter: { _id: id },
          update: { $inc: { quantity: qtyChange } },
        },
      };
    });

    const bulkResult = await Product.bulkWrite(bulkOps);

    return res.status(200).json({
      message: "Stock movement saved and products updated",
      movementId: movement._id,
      transRef,
      result: bulkResult,
    });
  } catch (err) {
    console.error("❗ Error saving stock movement:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}
