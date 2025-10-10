import { mongooseConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import { Transaction } from "@/models/Transactions";
import Product from "@/models/Product";

export default async function handler(req, res) {
  await mongooseConnect();
  const { id } = req.query;

  if (req.method === "PUT") {
    try {
      const { status } = req.body;

      // Fetch the order
      const order = await Order.findById(id).lean();
      if (!order) return res.status(404).json({ error: "Order not found" });

      // Prevent marking delivered twice
      if (order.status === "Delivered") {
        return res
          .status(400)
          .json({ error: "Order already marked as Delivered" });
      }

      // Update the status
      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      // Only handle "Delivered" logic if status is changed to Delivered
      if (status === "Delivered") {
        const items = (order.cartProducts || []).map((item) => ({
          name: item.name,
          qty: item.quantity,
          salePriceIncTax: item.price,
          productId: item.productId,
        }));

        // Save transaction
        await Transaction.create({
          tenderType: "online",
          amountPaid: order.total,
          total: order.total,
          staff: "Online User",
          location: "Web",
          device: "Web",
          tableName: null,
          discount: 0,
          discountReason: null,
          customerName: order.customer?.name || "Online User",
          transactionType: "Web",
          change: 0,
          items,
        });

        // Reduce inventory
        for (const item of items) {
          if (item.productId && item.qty > 0) {
            await Product.findByIdAndUpdate(
              item.productId,
              { $inc: { quantity: -item.qty, sold: item.qty } },
              { new: true }
            );
          }
        }
      }

      return res.status(200).json(updatedOrder);
    } catch (error) {
      console.error("Order update failed:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
