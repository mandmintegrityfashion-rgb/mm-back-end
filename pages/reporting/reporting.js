"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  LineController,
  Filler,
  ArcElement,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";
import Layout from "@/components/Layout";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  LineController,
  Filler,
  ArcElement
);

export default function Reporting() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedDays, setSelectedDays] = useState(14);
  const [granularity, setGranularity] = useState("Day");

  const handleGranularityChange = (period) => {
    setGranularity(period);
    switch (period) {
      case "Month":
        setSelectedDays(180);
        break;
      case "Week":
        setSelectedDays(90);
        break;
      case "Day":
        setSelectedDays(30);
        break;
      case "Hourly":
        setSelectedDays(2);
        break;
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const query = new URLSearchParams({
          location: selectedLocation,
          days: selectedDays,
          period: granularity,
        });
        const res = await fetch(`/api/reporting/reporting-data?${query}`);
        const data = await res.json();
        setReport(data);
      } catch (err) {
        console.error("Failed to fetch report:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedLocation, selectedDays, granularity]);

  if (loading) {
    return (
      <Layout title="Reporting">
        <div className="flex justify-center items-center h-[70vh] bg-blue-50">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!report) return null;

  const {
    dates = [],
    salesData = [],
    transactionQty = [],
    bestSellingProducts = [],
    salesByLocation = {},
    salesByTender = {},
    salesByEmployee = {},
    summary = {},
  } = report;

  const combinedLineData = {
    labels: dates,
    datasets: [
      {
        label: "Net Sales (₦)",
        data: salesData,
        fill: true,
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        borderColor: "#2563eb",
        tension: 0.35,
      },
      {
        label: "Transactions",
        data: transactionQty,
        borderColor: "#3b82f6",
        backgroundColor: "#3b82f6",
        type: "line",
        yAxisID: "y1",
        tension: 0.3,
      },
    ],
  };

  const pieData = {
    labels: Object.keys(salesByTender),
    datasets: [
      {
        data: Object.values(salesByTender),
        backgroundColor: ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"],
      },
    ],
  };

  const locationBars = {
    labels: Object.keys(salesByLocation),
    datasets: [
      {
        label: "Transactions",
        data: Object.values(salesByLocation),
        backgroundColor: "#3b82f6",
      },
    ],
  };

  const employeeStacked = {
    labels: dates,
    datasets: Object.entries(salesByEmployee).map(([name, values], i) => ({
      label: name,
      data: values,
      fill: true,
      backgroundColor: `rgba(${70 + i * 30}, ${120 + i * 10}, 255, 0.5)`,
    })),
  };

  const bestSellers = {
    labels: bestSellingProducts.map((p) => p[0]),
    datasets: [
      {
        label: "Units Sold",
        data: bestSellingProducts.map((p) => p[1]),
        backgroundColor: "#2563eb",
      },
    ],
  };

  const stockMargin = summary.stockMargin || summary.grossMargin || 0;
  const averageTransaction =
    summary.totalSales && summary.totalTransactions
      ? summary.totalSales / summary.totalTransactions
      : 0;

  return (
    <Layout title="Reporting">
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 md:p-10 space-y-10">
        {/* Header */}
        <header className="">
          <h1 className="text-4xl font-extrabold text-blue-900 mb-2">
            M&M Fashion — Performance Report
          </h1>
          <p className="text-gray-500 text-sm">
            Insight into your sales, trends, and performance overview.
          </p>
        </header>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-4 bg-white rounded-2xl shadow-md px-6 py-4 border border-blue-100">
          <label className="font-medium text-gray-600">Location:</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="border border-blue-200 px-3 py-1.5 rounded-md focus:ring-2 focus:ring-blue-400"
          >
            {["All", ...Object.keys(salesByLocation || {})].map((loc) => (
              <option key={loc}>{loc}</option>
            ))}
          </select>

          <label className="font-medium text-gray-600 ml-2">Last:</label>
          <input
            type="number"
            value={selectedDays}
            onChange={(e) => setSelectedDays(Number(e.target.value))}
            className="border border-blue-200 px-2 w-20 rounded-md text-center"
          />
          <span className="text-gray-600">days</span>

          <div className="ml-auto flex gap-2">
            {["Month", "Week", "Day", "Hourly"].map((period) => (
              <button
                key={period}
                onClick={() => handleGranularityChange(period)}
                className={`text-sm px-3 py-1.5 rounded-md border transition-all duration-200 ${
                  granularity === period
                    ? "bg-blue-600 text-white border-blue-600"
                    : "text-blue-600 border-blue-300 hover:bg-blue-50"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-blue-100 h-[350px] md:h-[400px]">
          <Line
            data={combinedLineData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { labels: { color: "#1e3a8a" } } },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { color: "#1e3a8a" },
                },
                y1: {
                  position: "right",
                  beginAtZero: true,
                  ticks: { color: "#3b82f6" },
                },
              },
            }}
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card title="Total Sales" value={`₦${summary.totalSales?.toLocaleString()}`} />
          <Card title="Transactions" value={summary.totalTransactions || 0} />
          <Card title="Gross Margin" value={`₦${stockMargin?.toLocaleString() || 0}`} />
          <Card
            title="Average Txn"
            value={`₦${averageTransaction.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}`}
          />
          <Card title="Operating Margin" value={`${summary.operatingMargin?.toFixed(2) || 0}%`} />
          <Card title="Low Stock Items" value={summary.lowStockItems || 0} />
          <Card title="Total Cost" value={`₦${summary.totalCost?.toLocaleString() || 0}`} />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ChartCard title="Sales by Tender">
            <div className="w-[200px] h-[200px] mx-auto">
              <Pie data={pieData} options={{ maintainAspectRatio: false }} />
            </div>
          </ChartCard>

          <ChartCard title="Transactions by Location">
            <Bar data={locationBars} options={{ indexAxis: "y" }} />
          </ChartCard>

          <ChartCard title="Best Sellers">
            <Bar data={bestSellers} options={{ indexAxis: "y" }} />
          </ChartCard>

          <ChartCard title="Sales by Employee">
            <Bar
              data={employeeStacked}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </ChartCard>
        </div>
      </div>
    </Layout>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 text-center border border-blue-100 hover:shadow-lg transition">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-xl font-bold text-blue-900">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-blue-100 hover:shadow-lg transition">
      <h3 className="font-semibold text-blue-800 mb-3">{title}</h3>
      {children}
    </div>
  );
}
