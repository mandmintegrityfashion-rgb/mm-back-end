"use client";

import { useEffect, useState, useCallback } from "react";
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [quickRange, setQuickRange] = useState("14");

  const quickRanges = [
    { label: "Today", value: "1" },
    { label: "7 Days", value: "7" },
    { label: "14 Days", value: "14" },
    { label: "30 Days", value: "30" },
    { label: "90 Days", value: "90" },
    { label: "6 Months", value: "180" },
    { label: "1 Year", value: "365" },
    { label: "Custom", value: "custom" },
  ];

  const handleQuickRange = (val) => {
    setQuickRange(val);
    if (val !== "custom") {
      setSelectedDays(Number(val));
      setDateFrom("");
      setDateTo("");
    }
  };

  const handleGranularityChange = (period) => {
    setGranularity(period);
    if (quickRange !== "custom") {
      switch (period) {
        case "Month":
          setSelectedDays(180);
          setQuickRange("180");
          break;
        case "Week":
          setSelectedDays(90);
          setQuickRange("90");
          break;
        case "Day":
          setSelectedDays(30);
          setQuickRange("30");
          break;
        case "Hourly":
          setSelectedDays(2);
          setQuickRange("custom");
          break;
      }
    }
  };

  const fetchReportData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);

      const cacheKey = `report_cache_${selectedLocation}_${selectedDays}_${granularity}_${dateFrom}_${dateTo}`;
      const cached = JSON.parse(localStorage.getItem(cacheKey));
      const lastFetched = localStorage.getItem(`${cacheKey}_time`);
      const cacheValid = cached && lastFetched && Date.now() - lastFetched < 12 * 60 * 60 * 1000;

      if (cacheValid && !forceRefresh) {
        setReport(cached);
        setLoading(false);
        setTimeout(() => fetchReportData(true), 100);
        return;
      }

      const params = {
        location: selectedLocation,
        days: selectedDays,
        period: granularity,
      };
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const query = new URLSearchParams(params);
      const res = await fetch(`/api/reports/reporting-data?${query}`);
      const data = await res.json();

      if (data) {
        setReport(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(`${cacheKey}_time`, Date.now());
      }
    } catch (err) {
      console.error("Failed to fetch report:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, selectedDays, granularity, dateFrom, dateTo]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  if (loading && !report) {
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

  // ✅ Chart configurations
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
      <div className="p-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
        <div className="max-w-screen-xl mx-auto space-y-8">
        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold text-blue-800">
            M&M Fashion — Performance Report
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Insight into your sales, trends, and performance overview.
          </p>
        </header>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm px-6 py-5 border border-blue-100 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="border border-blue-200 px-3 py-1.5 rounded-md focus:ring-2 focus:ring-blue-400 text-sm"
              >
                {["All", ...Object.keys(salesByLocation || {})].map((loc) => (
                  <option key={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Period</label>
              <select
                value={quickRange}
                onChange={(e) => handleQuickRange(e.target.value)}
                className="border border-blue-200 px-3 py-1.5 rounded-md focus:ring-2 focus:ring-blue-400 text-sm"
              >
                {quickRanges.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {quickRange === "custom" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="border border-blue-200 px-3 py-1.5 rounded-md text-sm focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="border border-blue-200 px-3 py-1.5 rounded-md text-sm focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </>
            )}

            <div className="ml-auto">
              <label className="block text-xs font-medium text-gray-500 mb-1">Granularity</label>
              <div className="flex gap-2">
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
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100 h-[350px] md:h-[400px]">
          <Line
            data={combinedLineData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { labels: { color: "#1e3a8a" } } },
              scales: {
                y: { beginAtZero: true, ticks: { color: "#1e3a8a" } },
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
          <Card title="Total Sales" value={`₦${(summary.totalSales || 0).toLocaleString()}`} />
          <Card title="Transactions" value={(summary.totalTransactions || 0).toLocaleString()} />
          <Card title="Gross Margin" value={`₦${(stockMargin || 0).toLocaleString()}`} />
          <Card
            title="Average Txn"
            value={`₦${averageTransaction.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
          />
          <Card title="Operating Margin" value={`${(summary.operatingMargin || 0).toFixed(2)}%`} />
          <Card title="Low Stock Items" value={(summary.lowStockItems || 0).toLocaleString()} />
          <Card title="Total Cost" value={`₦${(summary.totalCost || 0).toLocaleString()}`} />
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
      </div>
    </Layout>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 text-center border border-blue-100 hover:shadow-md transition">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-xl font-bold text-blue-900">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100 hover:shadow-md transition">
      <h3 className="font-semibold text-blue-800 mb-3">{title}</h3>
      {children}
    </div>
  );
}
