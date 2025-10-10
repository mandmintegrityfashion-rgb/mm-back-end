import { mongooseConnect } from "@/lib/mongoose";
import { Transaction } from "@/models/Transactions";
import { Product } from "@/models/Product";
import { Staff } from "@/models/Staff"; 
import {
  startOfDay,
  startOfHour,
  startOfWeek,
  startOfMonth,
  format,
  subDays,
  eachDayOfInterval,
  eachHourOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from "date-fns";

export default async function handler(req, res) {
  await mongooseConnect();

  const { location = "All", days = 14, period = "Day" } = req.query;
  const cutoffDate = subDays(new Date(), parseInt(days));
  const now = new Date();

  try {
    const transactions = await Transaction.find({
  ...(location !== "All" && { location }),
  createdAt: { $gte: cutoffDate },
})
  .populate("staff", "name") // assuming your staff model has a 'name' field
  .sort({ createdAt: 1 })
  .lean();

    const groupedSalesMap = {};
    const groupedTransactionsMap = {};
    const salesByLocation = {};
    const salesByTender = {};
    const employeeSalesMap = {}; // Total sales by staff
    const employeeSalesTimeSeries = {}; // Time-series sales by staff
    const productSales = {};

    let totalSales = 0;
    let totalTransactions = 0;
    let totalCost = 0;

    const getPeriodKey = (date) => {
      const d = new Date(date);
      switch (period.toLowerCase()) {
        case "month":
          return format(startOfMonth(d), "yyyy-MM");
        case "week":
          return format(startOfWeek(d), "yyyy-'W'II");
        case "hourly":
          return format(startOfHour(d), "yyyy-MM-dd HH:00");
        default:
          return format(startOfDay(d), "yyyy-MM-dd");
      }
    };

    // Collect productIds
    const productIds = new Set();
    transactions.forEach((tx) => {
      tx.items?.forEach((item) => {
        if (item.productId) {
          productIds.add(item.productId.toString());
        }
      });
    });

    // Load product costPrices from DB
    const products = await Product.find({ _id: { $in: Array.from(productIds) } }).lean();
    const costMap = {};
    products.forEach((p) => {
      costMap[p._id.toString()] = p.costPrice || 0;
    });

    // Process transactions
    transactions.forEach((tx) => {
      const key = getPeriodKey(tx.createdAt);

      groupedSalesMap[key] = (groupedSalesMap[key] || 0) + tx.total;
      groupedTransactionsMap[key] = (groupedTransactionsMap[key] || 0) + 1;

      if (tx.location) {
        salesByLocation[tx.location] = (salesByLocation[tx.location] || 0) + tx.total;
      }

      if (tx.tenderType) {
        salesByTender[tx.tenderType] = (salesByTender[tx.tenderType] || 0) + tx.total;
      }

     if (tx.staff?.name) {
  const staffName = tx.staff.name;

  employeeSalesMap[staffName] = (employeeSalesMap[staffName] || 0) + tx.total;

  if (!employeeSalesTimeSeries[staffName]) {
    employeeSalesTimeSeries[staffName] = {};
  }

  employeeSalesTimeSeries[staffName][key] =
    (employeeSalesTimeSeries[staffName][key] || 0) + tx.total;
}


      tx.items?.forEach((item) => {
        if (item.name) {
          productSales[item.name] = (productSales[item.name] || 0) + item.qty;
        }

        const cost = item.costPrice ?? costMap[item.productId?.toString()] ?? 0;
        if (item.qty) {
          totalCost += cost * item.qty;
        }
      });

      totalSales += tx.total;
      totalTransactions += 1;
    });

    const generateAllPeriods = (from, to, period) => {
      let intervalFn;
      let formatStr;

      switch (period.toLowerCase()) {
        case "month":
          intervalFn = eachMonthOfInterval;
          formatStr = "yyyy-MM";
          break;
        case "week":
          intervalFn = eachWeekOfInterval;
          formatStr = "yyyy-'W'II";
          break;
        case "hourly":
          intervalFn = eachHourOfInterval;
          formatStr = "yyyy-MM-dd HH:00";
          break;
        default:
          intervalFn = eachDayOfInterval;
          formatStr = "yyyy-MM-dd";
      }

      return intervalFn({ start: from, end: to }).map((d) => format(d, formatStr));
    };

    const sortedDates = generateAllPeriods(cutoffDate, now, period);
    const salesData = sortedDates.map((d) => groupedSalesMap[d] || 0);
    const transactionQty = sortedDates.map((d) => groupedTransactionsMap[d] || 0);

    const employeeStacked = {};
    for (const emp in employeeSalesTimeSeries) {
      employeeStacked[emp] = sortedDates.map(
        (d) => employeeSalesTimeSeries[emp][d] || 0
      );
    }

    const bestSellingProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const grossMargin = totalSales - totalCost;
    const operatingMargin = totalSales > 0 ? ((grossMargin / totalSales) * 100).toFixed(2) : 0;
    const averageTransaction =
      totalTransactions > 0
        ? parseFloat((totalSales / totalTransactions).toFixed(2))
        : 0;

    const lowStockItems = await Product.countDocuments({ stock: { $lte: 10 } });

    res.json({
      dates: sortedDates,
      salesData,
      transactionQty,
      salesByLocation,
      salesByTender,
      salesByEmployee: employeeStacked,
      employeeTotalSales: employeeSalesMap,
      bestSellingProducts,
      summary: {
        totalSales,
        totalCost,
        grossMargin,
        operatingMargin: Number(operatingMargin),
        totalTransactions,
        averageTransaction,
        lowStockItems,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch report data" });
  }
}
