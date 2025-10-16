import { mongooseConnect } from "@/lib/mongoose";
import { Transaction } from "@/models/Transactions";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { from, to, location, staff, transactionType } = req.query;

    const filter = {};

    // --- Filter by date range ---
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    // --- Optional filters ---
    if (location) filter.location = location;
    if (staff) filter.staff = staff;
    if (transactionType) filter.transactionType = transactionType;

    // --- Aggregate report ---
    const transactions = await Transaction.find(filter);

    if (!transactions.length) {
      return res.status(200).json({
        summary: {
          totalTransactions: 0,
          totalSales: 0,
          totalItemsSold: 0,
          averageTransactionValue: 0,
        },
        topProducts: [],
        byStaff: [],
        byLocation: [],
      });
    }

    // --- Totals ---
    const totalTransactions = transactions.length;
    const totalSales = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalItemsSold = transactions.reduce(
      (sum, t) => sum + (t.items?.reduce((a, i) => a + (i.qty || 0), 0) || 0),
      0
    );
    const averageTransactionValue = totalSales / totalTransactions;

    // --- Top-selling products ---
    const productMap = {};
    for (const t of transactions) {
      for (const item of t.items || []) {
        if (!productMap[item.name]) {
          productMap[item.name] = {
            name: item.name,
            qty: 0,
            total: 0,
          };
        }
        productMap[item.name].qty += item.qty;
        productMap[item.name].total += item.salePriceIncTax * item.qty;
      }
    }

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    // --- Breakdown by staff ---
    const byStaffMap = {};
    for (const t of transactions) {
      const staffName = t.staff || "Unknown";
      if (!byStaffMap[staffName]) {
        byStaffMap[staffName] = { staff: staffName, total: 0, transactions: 0 };
      }
      byStaffMap[staffName].total += t.total || 0;
      byStaffMap[staffName].transactions += 1;
    }
    const byStaff = Object.values(byStaffMap);

    // --- Breakdown by location ---
    const byLocationMap = {};
    for (const t of transactions) {
      const loc = t.location || "Unknown";
      if (!byLocationMap[loc]) {
        byLocationMap[loc] = { location: loc, total: 0, transactions: 0 };
      }
      byLocationMap[loc].total += t.total || 0;
      byLocationMap[loc].transactions += 1;
    }
    const byLocation = Object.values(byLocationMap);

    // --- Final report ---
    return res.status(200).json({
      summary: {
        totalTransactions,
        totalSales,
        totalItemsSold,
        averageTransactionValue,
      },
      topProducts,
      byStaff,
      byLocation,
      range: { from, to },
    });
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
