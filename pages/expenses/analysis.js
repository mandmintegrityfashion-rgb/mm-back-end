"use client";
import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import {
  Download,
  Mail,
  Share2,
  BarChart2,
  PieChart as PieIcon,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "#2563EB", // primary blue
  "#3B82F6",
  "#60A5FA",
  "#1D4ED8",
  "#93C5FD",
  "#1E40AF",
  "#60A5FA",
];

export default function ExpenseAnalysis() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBarChart, setShowBarChart] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    minAmount: "",
    maxAmount: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    async function fetchExpenses() {
      const res = await fetch("/api/expenses");
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
      setLoading(false);
    }
    fetchExpenses();
  }, []);

  const allCategories = [
    ...new Set(expenses.map((exp) => exp.category?.name).filter(Boolean)),
  ];

  const applyFilters = (expense) => {
    const { category, minAmount, maxAmount, startDate, endDate } = filters;
    const amount = Number(expense.amount);
    const date = new Date(expense.createdAt);
    return (
      (!category || expense.category?.name === category) &&
      (!minAmount || amount >= Number(minAmount)) &&
      (!maxAmount || amount <= Number(maxAmount)) &&
      (!startDate || date >= new Date(startDate)) &&
      (!endDate || date <= new Date(endDate))
    );
  };

  const filteredExpenses = expenses.filter(applyFilters);
  const totalSpent = filteredExpenses.reduce(
    (acc, exp) => acc + Number(exp.amount),
    0
  );

  const expensesByCategory = filteredExpenses.reduce((acc, curr) => {
    const catName = curr.category?.name || "Uncategorized";
    acc[catName] = (acc[catName] || 0) + Number(curr.amount);
    return acc;
  }, {});

  const chartData = Object.entries(expensesByCategory).map(
    ([category, amount]) => ({
      category,
      amount,
    })
  );

  const downloadReport = async () => {
    const res = await fetch("/api/expenses/analysis");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ExpenseReport.pdf";
    a.click();
  };

  return (
    <Layout>
      <div className="bg-gradient-to-b from-blue-50 to-white mx-auto px-6 py-10 space-y-10 text-gray-800">
        {/* Header */}
        <div className="max-w-screen-xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-blue-800 tracking-tight">
            M&M Fashion — Expense Analysis
          </h1>
          <p className="text-gray-500 text-lg">
            Track, visualize, and manage all your fashion business expenses.
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
          <div>
            <label className="block text-sm text-gray-600 mb-1 font-medium">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="p-2 border border-blue-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Categories</option>
              {allCategories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1 font-medium">
              Min Amount
            </label>
            <input
              type="number"
              placeholder="₦0"
              value={filters.minAmount}
              onChange={(e) =>
                setFilters({ ...filters, minAmount: e.target.value })
              }
              className="p-2 border border-blue-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1 font-medium">
              Max Amount
            </label>
            <input
              type="number"
              placeholder="₦0"
              value={filters.maxAmount}
              onChange={(e) =>
                setFilters({ ...filters, maxAmount: e.target.value })
              }
              className="p-2 border border-blue-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1 font-medium">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="p-2 border border-blue-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1 font-medium">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="p-2 border border-blue-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-100 p-8 rounded-2xl shadow text-center">
          <h2 className="text-lg font-semibold text-blue-700">
            Total Expenses
          </h2>
          <p className="text-4xl font-extrabold text-blue-900 mt-2">
            ₦{totalSpent.toLocaleString()}
          </p>
        </div>

        {loading ? (
          <div className="text-center text-blue-500 font-medium py-16">
            Loading expenses...
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center text-gray-500 font-medium py-16">
            No expenses match your filters.
          </div>
        ) : (
          <>
            {/* Chart + Expense List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart */}
              <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-blue-700">
                    Category Breakdown
                  </h2>
                  <button
                    onClick={() => setShowBarChart(!showBarChart)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {showBarChart ? (
                      <PieIcon className="w-5 h-5" />
                    ) : (
                      <BarChart2 className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <ResponsiveContainer width="100%" height={320}>
                  {showBarChart ? (
                    <BarChart data={chartData}>
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) =>
                          `₦${Number(value).toLocaleString()}`
                        }
                      />
                      <Legend />
                      <Bar dataKey="amount">
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`bar-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        label={({ name }) => name}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) =>
                          `₦${Number(value).toLocaleString()}`
                        }
                      />
                      <Legend />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Expense List */}
              <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
                <h2 className="text-lg font-semibold text-blue-700 mb-4">
                  Recent Expenses
                </h2>
                <ul className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
                  {filteredExpenses
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((exp) => (
                      <li
                        key={exp._id}
                        className="border-b border-blue-50 pb-2 last:border-none"
                      >
                        <p className="font-medium text-gray-800">{exp.title}</p>
                        <p className="text-sm text-gray-500">
                          ₦{Number(exp.amount).toLocaleString()} •{" "}
                          {exp.category?.name || "Uncategorized"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(exp.createdAt).toLocaleDateString()}
                        </p>
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 mt-6">
              <button
                onClick={downloadReport}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg font-medium shadow hover:bg-blue-700 transition"
              >
                <Download className="w-5 h-5" /> Download Report
              </button>

              <button
                onClick={() =>
                  window.open(
                    "mailto:?subject=M&M Fashion Expense Report&body=Please find attached your expense report."
                  )
                }
                className="flex items-center gap-2 bg-sky-600 text-white px-5 py-3 rounded-lg font-medium shadow hover:bg-sky-700 transition"
              >
                <Mail className="w-5 h-5" /> Send via Email
              </button>

              <button
                onClick={() =>
                  window.open(
                    "https://wa.me/?text=View%20your%20M%26M%20Fashion%20expense%20report%20here%3A%20https%3A%2F%2Fmnmfashion.com%2Freports%2FExpenseReport.pdf",
                    "_blank"
                  )
                }
                className="flex items-center gap-2 bg-gray-800 text-white px-5 py-3 rounded-lg font-medium shadow hover:bg-gray-900 transition"
              >
                <Share2 className="w-5 h-5" /> Share on WhatsApp
              </button>
            </div>
          </>
        )}
        </div>
      </div>
    </Layout>
  );
}
