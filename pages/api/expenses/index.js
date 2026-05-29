// pages/api/expenses/index.js

import { mongooseConnect } from "@/lib/mongoose";
import { requireAdminSession, withSessionRoute } from "@/lib/session";
import Expense from "@/models/Expense";

export default withSessionRoute(async function handler(req, res) {
  requireAdminSession(req);
  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const expenses = await Expense.find()
        .populate("category", "name") // Populate category name
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json(expenses);
    } catch (err) {
      console.error("GET error:", err);
      return res.status(500).json({ error: "Failed to fetch expenses" });
    }
  }

  if (req.method === "POST") {
  const { title, amount, category, description, location } = req.body;

  if (!title || !amount || !category) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const newExpense = await Expense.create({
      title,
      amount,
      category, 
      description,
      location: location || null,
    });

    return res.status(201).json(newExpense);
  } catch (err) {
    console.error("❌ Expense save failed:", err);
    return res.status(500).json({ error: "Failed to save expense" });
  }
}


  return res.status(405).json({ error: "Method not allowed" });
});
