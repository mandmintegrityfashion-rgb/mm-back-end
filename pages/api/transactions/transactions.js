import { mongooseConnect } from "@/lib/mongoose";
import { requireAdminSession, withSessionRoute } from "@/lib/session";
import { Transaction } from "@/models/Transactions";

export default withSessionRoute(async function handler(req, res) {
  requireAdminSession(req);

  if (req.method === "GET") {
    try {
      await mongooseConnect();

      const transactions = await Transaction
        .find()
        .sort({ createdAt: -1 })
        .lean();


      return res.status(200).json({ success: true, transactions });
    } catch (error) {
      console.error("Transaction GET API error:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
});
