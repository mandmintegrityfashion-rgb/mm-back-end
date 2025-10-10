// pages/api/products.js
import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";

export default async function handler(req, res) {
  const { method } = req;
  await mongooseConnect();

  try {
    if (method === "GET") {
      const { id, search } = req.query;

      if (id) {
        const product = await Product.findById(id);
        if (!product) {
          return res.status(404).json({ success: false, message: "Product not found" });
        }
        return res.json( product );
      }

      if (search) {
        const products = await Product.find({
          $or: [
            { name: { $regex: search, $options: "i" } },
            { barcode: { $regex: search, $options: "i" } },
          ],
        }).limit(10);

        return res.json({ success: true, data: products });
      }

      const products = await Product.find();
      return res.json({ success: true, data: products });
    }

    if (method === "POST") {
      const {
        name,
        description,
        costPrice,
        taxRate,
        salePriceIncTax,
        margin,
        barcode,
        category,
        images,
        properties,
        quantity,
        minStock,
        maxStock,
        isPromotion,
        promoPrice,
        promoStart,
        promoEnd,
      } = req.body;

      const productDoc = await Product.create({
        name,
        description,
        costPrice,
        taxRate,
        salePriceIncTax,
        margin,
        barcode,
        category,
        images,
        properties,
        quantity,
        minStock,
        maxStock,
        isPromotion,
        promoPrice,
        promoStart,
        promoEnd,
      });

      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: productDoc,
      });
    }

    if (method === "PUT") {
      const {
        _id,
        name,
        description,
        costPrice,
        taxRate,
        salePriceIncTax,
        margin,
        barcode,
        category,
        images,
        properties,
        quantity,
        minStock,
        maxStock,
        isPromotion,
        promoPrice,
        promoStart,
        promoEnd,
      } = req.body;

      if (!_id) {
        return res.status(400).json({ success: false, message: "Product ID required" });
      }

      const updated = await Product.findByIdAndUpdate(
        _id,
        {
          name,
          description,
          costPrice,
          taxRate,
          salePriceIncTax,
          margin,
          barcode,
          category,
          images,
          properties,
          quantity,
          minStock,
          maxStock,
          isPromotion,
          promoPrice,
          promoStart,
          promoEnd,
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      return res.json({
        success: true,
        message: "Product updated successfully",
        data: updated,
      });
    }

    if (method === "DELETE") {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ success: false, message: "Product ID required" });
      }

      const deleted = await Product.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

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
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
      error: error.message,
    });
  }
}
