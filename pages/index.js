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

  const summary = salesReport?.summary;
  const topProducts = salesReport?.topProducts || [];
  const byLocation = salesReport?.byLocation || [];
  const byStaff = salesReport?.byStaff || [];

  // KPIs
  const kpis = useMemo(() => {
    return {
      sales: summary?.totalSales || 0,
      salesChangePercent: 8,
      transactions: summary?.totalTransactions || 0,
      transactionsChangePercent: 5,
      avgTransactionValue: summary?.averageTransactionValue || 0,
      avgTransactionChangePercent: 3,
    };
  }, [summary?.averageTransactionValue, summary?.totalSales, summary?.totalTransactions]);

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );
  const activePeriodLabel =
    periodLabels.find((option) => option.value === period)?.label || "Today";
  const openOrdersCount = orders.filter(
    (order) => !["Delivered", "Cancelled"].includes(order.status)
  ).length;
  const locationCount = Array.isArray(store.locations) ? store.locations.length : 0;
  const brandName = store.storeName || "M&M Fashion";

  const kpiCards = [
    {
      label: "Total Sales",
      value: `₦${kpis.sales.toLocaleString()}`,
      changePercent: kpis.salesChangePercent,
      tone: "blue",
    },
    {
      label: "Transactions",
      value: kpis.transactions.toLocaleString(),
      changePercent: kpis.transactionsChangePercent,
      tone: "emerald",
    },
    {
      label: "Avg. Transaction",
      value: `₦${kpis.avgTransactionValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      changePercent: kpis.avgTransactionChangePercent,
      tone: "amber",
    },
  ];

  const spotlightStats = [
    {
      label: "Expense outflow",
      value: `₦${totalExpenses.toLocaleString()}`,
      note: "All logged operational costs",
    },
    {
      label: "Open orders",
      value: openOrdersCount.toLocaleString(),
      note: "Awaiting fulfillment or delivery",
    },
    {
      label: "Locations",
      value: locationCount ? locationCount.toLocaleString() : "Not set",
      note: "Registered selling points",
    },
  ];

  const axisColor = "rgba(148, 163, 184, 0.18)";
  const tickColor = "#5b6b85";
  const sharedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: tickColor },
      },
      y: {
        beginAtZero: true,
        grid: { color: axisColor },
        ticks: { color: tickColor },
      },
    },
  };

  const sharedLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: tickColor },
      },
      y: {
        beginAtZero: true,
        grid: { color: axisColor },
        ticks: { color: tickColor },
      },
    },
  };

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
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[90rem] space-y-8">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="shell-panel overflow-hidden"
          >
            <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(18rem,22rem)] lg:p-8">
              <div>
                <span className="shell-pill">Dashboard overview</span>
                <h1 className="mt-5 max-w-3xl text-[var(--mm-ink)]">
                  Welcome back, {user.name || "Admin"}.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  {brandName} is currently tuned to the {activePeriodLabel.toLowerCase()} window.
                  Track sales, order pressure, and expense movement from a cleaner inventory control room.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push("/products/new")}
                    className="inline-flex items-center justify-center rounded-md bg-[var(--mm-blue)] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[var(--mm-blue-dark)]"
                  >
                    + Add Product
                  </button>
                  <button
                    onClick={() => router.push("/reporting/reporting")}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/92 px-5 py-3 text-sm font-semibold text-[var(--mm-navy)] shadow-sm hover:border-blue-200 hover:bg-blue-50"
                  >
                    Open Reports
                  </button>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="shell-chip">Store: {brandName}</span>
                  <span className="shell-chip">Focus: {activePeriodLabel}</span>
                  <span className="shell-chip">Orders in motion: {openOrdersCount}</span>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-white p-6 text-[var(--mm-navy)] shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Live signal
                </p>
                <div className="mt-6 space-y-4">
                  {spotlightStats.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-[var(--mm-ink)]">{item.value}</p>
                      <p className="mt-2 text-sm text-slate-600">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

        {/* Period Filter */}
          <div className="flex flex-wrap gap-3">
          {periodLabels.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                period === p.value
                    ? "border border-[var(--mm-blue)] bg-[var(--mm-blue)] text-white shadow-sm"
                    : "border border-slate-200 bg-white text-[var(--mm-navy)] shadow-sm hover:border-blue-200 hover:bg-blue-50"
              }`}
            >
              {p.label}
            </button>
          ))}
          </div>

        {/* KPIs */}
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {kpiCards.map((card) => (
              <KpiCard key={card.label} {...card} />
            ))}
          </section>

        {/* Charts */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <ChartCard title="Top Selling Products">
              <Bar data={salesByProductData} options={sharedBarOptions} />
          </ChartCard>
          <ChartCard title="Sales by Location">
              <Line data={salesByLocationData} options={sharedLineOptions} />
          </ChartCard>
          <ChartCard title="Expense Breakdown">
              <Bar data={expenseChart} options={sharedBarOptions} />
          </ChartCard>
          </section>

        {/* Lists */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
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
      </div>
    </Layout>
  );
}

/* --- Reusable UI Cards --- */
function KpiCard({ label, value, changePercent, tone = "blue" }) {
  const isNegative = changePercent < 0;
  const toneMap = {
    blue: {
      orb: "bg-blue-400/25",
      label: "text-blue-700",
      chip: "bg-blue-500/10 text-blue-700",
    },
    emerald: {
      orb: "bg-emerald-400/25",
      label: "text-emerald-700",
      chip: "bg-emerald-500/10 text-emerald-700",
    },
    amber: {
      orb: "bg-amber-400/25",
      label: "text-amber-700",
      chip: "bg-amber-500/12 text-amber-700",
    },
  };
  const accent = toneMap[tone] || toneMap.blue;

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 220 }}
      className="card"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mm-muted)]">
        {label}
      </p>
      <div className="mt-6 flex items-end justify-between gap-4">
        <span className="text-3xl font-semibold text-[var(--mm-ink)]">{value}</span>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            isNegative
              ? "bg-rose-500/10 text-rose-700"
              : accent.chip
          }`}
        >
          {isNegative ? "▼" : "▲"} {Math.abs(changePercent)}%
        </span>
      </div>
      <p className={`mt-3 text-sm font-medium ${accent.label}`}>
        Updated against the last comparison window
      </p>
    </motion.article>
  );
}

function ChartCard({ title, children }) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="shell-panel h-[420px] p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mm-muted)]">
        Analytics
      </p>
      <h2 className="mt-2 text-xl font-semibold text-[var(--mm-ink)]">{title}</h2>
      <div className="mt-5 h-[calc(100%-4.75rem)]">{children}</div>
    </motion.article>
  );
}

function ListCard({ title, items = [] }) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="shell-panel h-[420px] overflow-y-auto p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mm-muted)]">
        Snapshot list
      </p>
      <h2 className="mt-2 text-xl font-semibold text-[var(--mm-ink)]">{title}</h2>
      <ul className="mt-5 space-y-3 text-sm">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <li
              key={idx}
              className="rounded-2xl border border-white/75 bg-[rgba(239,246,255,0.72)] px-4 py-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-[var(--mm-navy)]">{item.label}</div>
                {item.meta && (
                    <div className="mt-1 text-xs text-slate-500">{item.meta}</div>
                )}
                </div>
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--mm-blue)]/70 shadow-[0_0_0_4px_rgba(37,99,235,0.12)]" />
              </div>
            </li>
          ))
        ) : (
          <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-center italic text-slate-400">
            No data available
          </li>
        )}
      </ul>
    </motion.article>
  );
}
