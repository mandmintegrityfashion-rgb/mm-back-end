"use client";

import Layout from "@/components/Layout";
import { Bar, Line } from "react-chartjs-2";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
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

export default function Home() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState("Admin");
  const [kpis, setKpis] = useState(null);
  const [productLabels, setProductLabels] = useState([]);
  const [salesToday, setSalesToday] = useState([]);
  const [salesBefore, setSalesBefore] = useState([]);
  const [hourlyTransactions, setHourlyTransactions] = useState([]);
  const [storeInfo, setStoreInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowProducts, setLowProducts] = useState([]);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true);
        const [txRes, storeRes, staffRes, expenseRes, orderRes, prodRes] =
          await Promise.allSettled([
            axios.get("/api/transactions/transactions"),
            axios.get("/api/setup/get"),
            axios.get("/api/staff"),
            axios.get("/api/expenses"),
            axios.get("/api/orders"),
            axios.get("/api/products"),
          ]);

        const store = storeRes.value?.data?.store || {};
        const locations = store?.locations || [];

        setAllTransactions(txRes.value?.data?.transactions || []);
        setStoreInfo(store);
        setSelectedUser(storeRes.value?.data?.user?.name || "Admin");
        setExpenses(expenseRes.value?.data || []);
        setRecentOrders(orderRes.value?.data?.orders?.slice(0, 5) || []);
        const products = prodRes.value?.data || [];

        if (products.length > 0) {
          const sorted = [...products].sort(
            (a, b) => (b.sold || 0) - (a.sold || 0)
          );
          setTopProducts(sorted.slice(0, 5));
          setLowProducts(sorted.slice(-5).reverse());
        } else {
          setTopProducts([]);
          setLowProducts([]);
        }

        if (locations.length > 0) {
          setSelectedLocation(locations[0]);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (allTransactions.length > 0) {
      processDashboardData(allTransactions);
    } else {
      setKpis({
        sales: 0,
        salesChangePercent: 0,
        transactions: 0,
        transactionsChangePercent: 0,
        avgTransactionValue: 0,
        avgTransactionChangePercent: 0,
      });
      setProductLabels([]);
      setSalesToday([]);
      setSalesBefore([]);
      setHourlyTransactions([]);
    }
  }, [allTransactions]);

  function processDashboardData(transactions) {
    const filteredTx = transactions;
    const totalSales = filteredTx.reduce((sum, tx) => sum + (tx.total || 0), 0);
    const avgTxVal = filteredTx.length > 0 ? totalSales / filteredTx.length : 0;

    const productSales = {};
    filteredTx.forEach((tx) => {
      (tx.items || []).forEach((item) => {
        if (!productSales[item.name]) productSales[item.name] = 0;
        productSales[item.name] += (item.price || 0) * (item.qty || 0);
      });
    });

    const labels = Object.keys(productSales);
    const todaySales = Object.values(productSales);
    const dummyWeekBefore = todaySales.map((val) => Math.floor(val * 0.8));

    const hourly = new Array(15).fill(0);
    filteredTx.forEach((tx) => {
      const hour = new Date(tx.createdAt).getHours();
      const index = hour - 9;
      if (index >= 0 && index < hourly.length) hourly[index]++;
    });

    setProductLabels(labels);
    setSalesToday(todaySales);
    setSalesBefore(dummyWeekBefore);
    setHourlyTransactions(hourly);

    setKpis({
      sales: totalSales,
      salesChangePercent: 8,
      transactions: filteredTx.length,
      transactionsChangePercent: 5,
      avgTransactionValue: avgTxVal,
      avgTransactionChangePercent: 3,
    });
  }

  const salesByProductData = {
    labels: productLabels.length > 0 ? productLabels : ["No Data"],
    datasets: [
      {
        label: "Today",
        data: salesToday.length > 0 ? salesToday : [0],
        backgroundColor: "#2563EB",
      },
      {
        label: "Week Before",
        data: salesBefore.length > 0 ? salesBefore : [0],
        backgroundColor: "#93C5FD",
      },
    ],
  };

  const transactionsByHourData = {
    labels: Array.from({ length: 15 }, (_, i) => `${i + 9}:00`),
    datasets: [
      {
        label: "Transactions",
        data:
          hourlyTransactions.length > 0
            ? hourlyTransactions
            : new Array(15).fill(0),
        borderColor: "#1E3A8A",
        backgroundColor: "rgba(37, 99, 235, 0.3)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const expenseData = {
    labels: expenses.length > 0 ? expenses.map((e) => e.title) : ["No Data"],
    datasets: [
      {
        label: "Expenses",
        data: expenses.length > 0 ? expenses.map((e) => e.amount) : [0],
        backgroundColor: "#3B82F6",
      },
    ],
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 p-6 font-sans text-blue-900">
        <header className="flex flex-col sm:flex-row items-center justify-between mb-10 space-y-4 sm:space-y-0">
          <h1 className="text-4xl font-bold font-[Playfair_Display]">
            Welcome, {selectedUser}
          </h1>
          <button
            className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold rounded-xl px-5 py-3 shadow-lg transition-transform hover:scale-[1.03]"
            onClick={() => router.push("/products/new")}
          >
            + Add a Product
          </button>
        </header>

        {loading || !kpis ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <section className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <KpiCard
                label="Total Sales"
                value={`₦${kpis.sales.toLocaleString()}`}
                changePercent={kpis.salesChangePercent}
              />
              <KpiCard
                label="Transactions"
                value={kpis.transactions}
                changePercent={kpis.transactionsChangePercent}
                isCurrency={false}
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
              <ChartCard title="Sales by Product">
                <Bar data={salesByProductData} options={{ responsive: true }} />
              </ChartCard>
              <ChartCard title="Hourly Transactions">
                <Line
                  data={transactionsByHourData}
                  options={{ responsive: true }}
                />
              </ChartCard>
              <ChartCard title="Expense Breakdown">
                <Bar data={expenseData} options={{ responsive: true }} />
              </ChartCard>
            </section>

            {/* Lists */}
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-10">
              <ListCard
                title="Recent Orders"
                items={recentOrders.map(
                  (o) => `${o.customer?.name || "Unknown"} - ₦${o.total || 0}`
                )}
              />
              <ListCard
                title="Top Products"
                items={topProducts.map(
                  (p) => `${p.name} - Sold: ${p.sold || 0}`
                )}
              />
              <ListCard
                title="Low Performing Products"
                items={lowProducts.map(
                  (p) => `${p.name} - Sold: ${p.sold || 0}`
                )}
              />
            </section>

            {/* Footer */}
            <section className="mt-12 flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-6 lg:space-y-0">
              <button
                onClick={() => router.push("/reporting/reporting")}
                className="bg-blue-700 hover:bg-blue-900 text-white font-semibold rounded-xl px-6 py-3 shadow-lg transition-transform hover:scale-[1.03]"
              >
                View Full Dashboard
              </button>

              <div className="text-center text-blue-800">
                <h3 className="font-semibold text-lg mb-1">M&M Fashion</h3>
                <p>Elegance. Quality. Confidence. Since 2025</p>
              </div>

              <div className="text-blue-700 text-sm italic">
                Designed for fashion analytics ✨
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}

/* Sub-components */
function KpiCard({ label, value, changePercent }) {
  const isNegative = changePercent < 0;
  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 flex flex-col items-center border border-blue-100 hover:shadow-xl transition">
      <span className="text-2xl font-bold text-blue-900">{value}</span>
      <span className="text-sm text-blue-600">{label}</span>
      <span
        className={`mt-2 font-semibold ${
          isNegative ? "text-red-600" : "text-green-600"
        }`}
      >
        {isNegative ? "▼" : "▲"} {Math.abs(changePercent)}%
      </span>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 border border-blue-100 flex flex-col h-[40vh]">
      <h2 className="text-lg font-semibold text-blue-900 mb-3">{title}</h2>
      <div className="flex-grow overflow-hidden">{children}</div>
    </div>
  );
}

function ListCard({ title, items }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 border border-blue-100 overflow-y-auto h-[40vh]">
      <h2 className="text-lg font-semibold text-blue-900 mb-3">{title}</h2>
      <ul className="space-y-2 text-sm text-blue-800">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <li
              key={idx}
              className="bg-blue-50 rounded-md px-3 py-2 hover:bg-blue-100 transition"
            >
              {item}
            </li>
          ))
        ) : (
          <li className="text-gray-400 italic">No data available</li>
        )}
      </ul>
    </div>
  );
}
