import mongoose from "mongoose";
import { Transaction } from "@/models/Transactions";
import Staff from "@/models/Staff"; // ✅ Add this line

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      await connectDB();

      // Fetch all transactions and populate the staff field with name
      const transactions = await Transaction
  .find()
  .sort({ createdAt: -1 }) // ✅ Sort by newest first
  .populate("staff", "name");


      return res.status(200).json({ success: true, transactions });
    } catch (error) {
      console.error("Transaction GET API error:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
