"use client";

import Layout from "@/components/Layout";
import { Bar, Line } from "react-chartjs-2";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// SWR fetcher
const fetcher = (url) => axios.get(url).then((res) => res.data);

export default function Home() {
  const router = useRouter();
  const [period, setPeriod] = useState("today");

  const getDateRange = () => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    switch (period) {
      case "today":
        return `from=${today}&to=${today}`;
      case "yesterday": {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        return `from=${y.toISOString().slice(0, 10)}&to=${y.toISOString().slice(0, 10)}`;
      }
      case "7days": {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        return `from=${d.toISOString().slice(0, 10)}&to=${today}`;
      }
      case "30days": {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        return `from=${d.toISOString().slice(0, 10)}&to=${today}`;
      }
      case "month": {
        return `from=${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01&to=${today}`;
      }
      case "year":
        return `from=${now.getFullYear()}-01-01&to=${today}`;
      default:
        return `from=${today}&to=${today}`;
    }
  };

  const periodLabels = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "7 Days", value: "7days" },
    { label: "30 Days", value: "30days" },
    { label: "This Month", value: "month" },
    { label: "This Year", value: "year" },
  ];

  const { data: salesReport } = useSWR(`/api/reports/sales?${getDateRange()}`, fetcher, {
    refreshInterval: 60000,
  });

  const { data: storeData } = useSWR("/api/setup/get", fetcher);
  const { data: expenseData } = useSWR("/api/expenses", fetcher);
  const { data: orderData } = useSWR("/api/orders", fetcher, {
    refreshInterval: 60000,
  });

  const store = storeData?.store || {};
  const user = storeData?.user || {};
  const expenses = Array.isArray(expenseData)
    ? expenseData
    : expenseData?.expenses || [];
  const orders = orderData?.orders || [];

  const report = salesReport || {};
  const summary = report.summary || {};
  const topProducts = report.topProducts || [];
  const byLocation = report.byLocation || [];
  const byStaff = report.byStaff || [];

  // KPIs
  const kpis = useMemo(() => {
    return {
      sales: summary.totalSales || 0,
      salesChangePercent: 8,
      transactions: summary.totalTransactions || 0,
      transactionsChangePercent: 5,
      avgTransactionValue: summary.averageTransactionValue || 0,
      avgTransactionChangePercent: 3,
    };
  }, [summary]);

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );

  // Bar chart for top products
  const salesByProductData = {
    labels: topProducts.map((p) => p.name),
    datasets: [
      {
        label: "Units Sold",
        data: topProducts.map((p) => p.qty),
        backgroundColor: "#2563EB",
      },
    ],
  };

  // Line chart by location
  const salesByLocationData = {
    labels: byLocation.map((loc) => loc.location),
    datasets: [
      {
        label: "Sales by Location (₦)",
        data: byLocation.map((loc) => loc.total),
        borderColor: "#1E3A8A",
        backgroundColor: "rgba(37,99,235,0.3)",
        fill: true,
      },
    ],
  };

  // Expense breakdown chart
  const expenseChart = {
    labels: expenses.map((e) => e.title || "Untitled"),
    datasets: [
      {
        label: "Expenses",
        data: expenses.map((e) => e.amount || 0),
        backgroundColor: "#3B82F6",
      },
    ],
  };

  // Recent Orders
  const recentOrders = orders
    .slice(0, 10)
    .map((o) => ({
      label: `${o.customer?.name || "Unknown"} - ₦${Number(
        o.total || 0
      ).toLocaleString()}`,
      meta: `${o.status || "Pending"} • ${new Date(
        o.createdAt
      ).toLocaleDateString()}`,
    }));

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 text-blue-900">
        <header className="flex flex-col sm:flex-row justify-between mb-6">
          <h1 className="text-4xl font-bold">
            Welcome, {user.name || "Admin"}
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/products/new")}
              className="bg-blue-700 text-white px-5 py-3 rounded-xl shadow hover:bg-blue-900"
            >
              + Add Product
            </button>
            <button
              onClick={() => router.push("/reporting/reporting")}
              className="bg-white border px-4 py-2 rounded-lg hover:bg-blue-50"
            >
              Reports
            </button>
          </div>
        </header>

        {/* Period Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {periodLabels.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`text-sm px-4 py-2 rounded-lg border transition-all ${
                period === p.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <KpiCard
            label="Total Sales"
            value={`₦${kpis.sales.toLocaleString()}`}
            changePercent={kpis.salesChangePercent}
          />
          <KpiCard
            label="Transactions"
            value={kpis.transactions.toLocaleString()}
            changePercent={kpis.transactionsChangePercent}
          />
          <KpiCard
            label="Avg. Transaction"
            value={`₦${kpis.avgTransactionValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            changePercent={kpis.avgTransactionChangePercent}
          />
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <ChartCard title="Top Selling Products">
            <Bar data={salesByProductData} options={{ responsive: true }} />
          </ChartCard>
          <ChartCard title="Sales by Location">
            <Line data={salesByLocationData} options={{ responsive: true }} />
          </ChartCard>
          <ChartCard title="Expense Breakdown">
            <Bar data={expenseChart} options={{ responsive: true }} />
          </ChartCard>
        </section>

        {/* Lists */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-10">
          <ListCard
            title="Top Staff by Sales"
            items={byStaff.map((s) => ({
              label: `${s.staff} - Transactions: ${s.transactions}`,
              meta: `₦${(s.total || 0).toLocaleString()}`,
            }))}
          />
          <ListCard
            title="Top Products"
            items={topProducts.map((p) => ({
              label: `${p.name} - Sold: ${p.qty}`,
              meta: `₦${(p.total || 0).toLocaleString()}`,
            }))}
          />
          <ListCard
            title="Expenses"
            items={expenses.map((e) => ({
              label: e.title || "Untitled",
              meta: `₦${Number(e.amount || 0).toLocaleString()}`,
            }))}
          />
          <ListCard title="Recent Orders" items={recentOrders} />
        </section>
      </div>
    </Layout>
  );
}

/* --- Reusable UI Cards --- */
function KpiCard({ label, value, changePercent }) {
  const isNegative = changePercent < 0;
  return (
    <motion.div
      whileHover={{ scale: 1.035 }}
      transition={{ type: "spring", stiffness: 220 }}
      className="bg-white rounded-2xl shadow-lg p-5 flex flex-col items-center border border-blue-100 hover:shadow-xl"
    >
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-sm text-blue-600">{label}</span>
      <span
        className={`mt-2 font-semibold ${
          isNegative ? "text-red-600" : "text-green-600"
        }`}
      >
        {isNegative ? "▼" : "▲"} {Math.abs(changePercent)}%
      </span>
    </motion.div>
  );
}

function ChartCard({ title, children }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl shadow-lg p-5 border border-blue-100 h-[40vh]"
    >
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="h-full">{children}</div>
    </motion.div>
  );
}

function ListCard({ title, items = [] }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl shadow-lg p-5 border border-blue-100 h-[40vh] overflow-y-auto"
    >
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <ul className="space-y-2 text-sm">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <li
              key={idx}
              className="bg-blue-50 rounded-md px-3 py-2 flex justify-between items-center"
            >
              <div>
                <div className="font-medium text-blue-900">{item.label}</div>
                {item.meta && (
                  <div className="text-xs text-blue-700">{item.meta}</div>
                )}
              </div>
            </li>
          ))
        ) : (
          <li className="text-gray-400 italic">No data available</li>
        )}
      </ul>
    </motion.div>
  );
}
