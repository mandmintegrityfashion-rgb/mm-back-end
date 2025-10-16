import { mongooseConnect } from "@/lib/mongoose";
import { Transaction } from "@/models/Transactions";
import Order from "@/models/Order";
import Product from "@/models/Product";

export default async function handler(req, res) {
  await mongooseConnect();

  try {
    const { location = "All", days = 30, period = "Day" } = req.query;

    // 🕒 Date filter
    const dateCutoff = new Date();
    dateCutoff.setDate(dateCutoff.getDate() - parseInt(days));

    const matchFilter = {
      createdAt: { $gte: dateCutoff },
      ...(location !== "All" && { location }),
    };

    // Fetch transactions (POS)
    const posTransactions = await Transaction.find(matchFilter);
    // Fetch online orders
    const onlineOrders = await Order.find({
      createdAt: { $gte: dateCutoff },
      paymentStatus: "Paid",
    });

    const allTransactions = [
      ...posTransactions.map((t) => ({ ...t.toObject(), source: "POS" })),
      ...onlineOrders.map((o) => ({
        total: o.total,
        items: o.items || [],
        staff: "Online User",
        tenderType: "Online",
        location: "Web",
        createdAt: o.createdAt,
        source: "WEB",
      })),
    ];

    let totalSales = 0;
    let totalCost = 0;
    let totalUnitsSold = 0;
    let totalTransactions = allTransactions.length;
    const productStats = {};

    // 💰 Calculate totals
    for (const t of allTransactions) {
      totalSales += t.total || 0;

      for (const item of t.items || []) {
        totalUnitsSold += item.qty || item.quantity || 0;

        const qty = item.qty || item.quantity || 0;
        const price = item.salePriceIncTax || item.price || 0;

        if (item.productId) {
          const product = await Product.findById(item.productId).select("costPrice");
          if (product) totalCost += (product.costPrice || 0) * qty;
        }

        const name = item.name || "Unnamed Product";
        productStats[name] = (productStats[name] || 0) + qty;
      }
    }

    const grossMargin = totalSales - totalCost;
    const operatingMargin =
      totalSales > 0 ? ((grossMargin / totalSales) * 100).toFixed(2) : 0;

    // 🧮 Group by period
    const groupFormat =
      period === "Month"
        ? { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
        : period === "Week"
        ? { $dateToString: { format: "%Y-%U", date: "$createdAt" } }
        : period === "Hourly"
        ? { $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" } }
        : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };

    const salesAggregation = await Transaction.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: groupFormat,
          totalSales: { $sum: "$total" },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dates = salesAggregation.map((a) => a._id);
    const salesData = salesAggregation.map((a) => a.totalSales);
    const transactionQty = salesAggregation.map((a) => a.transactionCount);

    // 🔹 Tender Type Breakdown
    const salesByTender = allTransactions.reduce((acc, t) => {
      const key = t.tenderType || (t.source === "WEB" ? "Online" : "Unknown");
      acc[key] = (acc[key] || 0) + (t.total || 0);
      return acc;
    }, {});

    // 🔹 Sales by Location
    const salesByLocation = allTransactions.reduce((acc, t) => {
      const key = t.location || (t.source === "WEB" ? "Online" : "Unspecified");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // 🔹 Sales by Employee
    const salesByEmployee = {};
    allTransactions.forEach((t) => {
      const name = t.staff || "Unknown";
      if (!salesByEmployee[name]) salesByEmployee[name] = {};
      const dateKey = new Date(t.createdAt).toISOString().slice(0, 10);
      salesByEmployee[name][dateKey] =
        (salesByEmployee[name][dateKey] || 0) + (t.total || 0);
    });

    const employeeNormalized = {};
    const allDates = [...new Set(dates)];
    for (const [name, sales] of Object.entries(salesByEmployee)) {
      employeeNormalized[name] = allDates.map((d) => sales[d] || 0);
    }

    // 🔹 Best sellers
    const bestSellingProducts = Object.entries(productStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // 🔹 Low stock count
    const lowStockItems = await Product.countDocuments({ quantity: { $lt: 5 } });

    // ✅ Return response
    res.status(200).json({
      dates,
      salesData,
      transactionQty,
      bestSellingProducts,
      salesByLocation,
      salesByTender,
      salesByEmployee: employeeNormalized,
      summary: {
        totalSales,
        totalTransactions,
        totalUnitsSold,
        totalCost,
        grossMargin,
        operatingMargin: parseFloat(operatingMargin),
        averageTransaction: totalSales / (totalTransactions || 1),
        lowStockItems,
      },
    });
  } catch (err) {
    console.error("Error generating report:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
}
