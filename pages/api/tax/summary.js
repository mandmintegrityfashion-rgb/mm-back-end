// /pages/api/tax/summary.js
import { mongooseConnect } from "@/lib/mongoose";
import { Transaction } from "@/models/Transactions";
import Expense from "@/models/Expense";
import Product from "@/models/Product";

const n = (v) => (typeof v === "number" && !isNaN(v) ? v : 0);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  await mongooseConnect();

  try {
    // Fetch transactions and expenses
    const [transactions, expenses] = await Promise.all([
      Transaction.find({}).lean(),
      Expense.find({}).lean().catch(() => []),
    ]);

    if (!transactions?.length) {
      return res.status(200).json({
        totalRevenue: 0,
        cogs: 0,
        operatingExpenses: 0,
        grossProfit: 0,
        taxableIncome: 0,
        citRate: 0,
        companyIncomeTax: 0,
        vatOnSales: 0,
        band: "No data",
        breakdown: [],
      });
    }

    const VAT_RATE = 7.5; // Nigeria VAT %
    let totalRevenue = 0;
    let cogs = 0;

    // --- Revenue & COGS Calculation ---
    for (const t of transactions) {
      totalRevenue += n(t.total);
      if (Array.isArray(t.items)) {
        for (const item of t.items) {
          const qty = n(item.qty) || n(item.quantity) || 1;
          let cost = 0;

          // Prefer pulling costprice from Product if productId exists
          if (item.productId) {
            const product = await Product.findById(item.productId).select("costprice").lean();
            cost = n(product?.costprice);
          }

          // Fallbacks
          if (!cost)
            cost =
              n(item.costPrice) ||
              n(item.buyPrice) ||
              n(item.purchasePrice) ||
              n(item.productCost);

          cogs += cost * qty;
        }
      }
    }

    // --- Operating Expenses ---
    const operatingExpenses = (expenses || []).reduce((sum, e) => sum + n(e.amount), 0);

    // --- Profit and Taxes ---
    const grossProfit = totalRevenue - cogs;
    const taxableIncome = Math.max(0, grossProfit - operatingExpenses);

    // Determine revenue band & CIT rate
    let band = "Small Company (<₦25m)";
    let citRate = 0;
    if (totalRevenue > 25_000_000 && totalRevenue <= 100_000_000) {
      band = "Medium Company (₦25m–₦100m)";
      citRate = 20;
    } else if (totalRevenue > 100_000_000) {
      band = "Large Company (>₦100m)";
      citRate = 30;
    }

    const companyIncomeTax = (citRate / 100) * taxableIncome;
    const vatOnSales = (VAT_RATE / 100) * totalRevenue;

    // --- Monthly Breakdown ---
    const monthly = {};
    for (const t of transactions) {
      const d = new Date(t.createdAt || Date.now());
      const key = d.toLocaleString("default", { month: "short", year: "numeric" });
      const sale = n(t.total);
      const vat = (VAT_RATE / 100) * sale;
      if (!monthly[key]) monthly[key] = { income: 0, vat: 0 };
      monthly[key].income += sale;
      monthly[key].vat += vat;
    }

    const breakdown = Object.entries(monthly)
      .map(([month, vals]) => ({ month, income: vals.income, vat: vals.vat }))
      .sort(
        (a, b) =>
          new Date(`1 ${a.month}`) - new Date(`1 ${b.month}`)
      );

    // --- Final Response ---
    return res.status(200).json({
      totalRevenue,
      cogs,
      operatingExpenses,
      grossProfit,
      taxableIncome,
      citRate,
      companyIncomeTax,
      vatOnSales,
      band,
      breakdown,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ /api/tax/summary error:", err);
    res.status(500).json({ error: "Failed to generate tax summary" });
  }
}
