"use client";

import Layout from "@/components/Layout";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function TaxAnalysisPage() {
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("year");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [chartView, setChartView] = useState("monthly");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const periodOptions = [
    { label: "This Year", value: "year" },
    { label: "This Quarter", value: "quarter" },
    { label: "This Month", value: "month" },
    { label: "Last 6 Months", value: "6months" },
    { label: "Specific Year", value: "specific-year" },
    { label: "Custom Range", value: "custom" },
  ];

  const fetchTaxData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      const now = new Date();

      if (period === "year") {
        params.set("from", `${now.getFullYear()}-01-01`);
        params.set("to", now.toISOString().slice(0, 10));
      } else if (period === "quarter") {
        const qMonth = Math.floor(now.getMonth() / 3) * 3;
        params.set("from", `${now.getFullYear()}-${String(qMonth + 1).padStart(2, "0")}-01`);
        params.set("to", now.toISOString().slice(0, 10));
      } else if (period === "month") {
        params.set("from", `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`);
        params.set("to", now.toISOString().slice(0, 10));
      } else if (period === "6months") {
        const sixAgo = new Date(now);
        sixAgo.setMonth(sixAgo.getMonth() - 6);
        params.set("from", sixAgo.toISOString().slice(0, 10));
        params.set("to", now.toISOString().slice(0, 10));
      } else if (period === "specific-year") {
        params.set("from", `${selectedYear}-01-01`);
        params.set("to", `${selectedYear}-12-31`);
      } else if (period === "custom" && customFrom && customTo) {
        params.set("from", customFrom);
        params.set("to", customTo);
      }

      const res = await fetch(`/api/tax/summary?${params}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setTaxData(data);
    } catch (err) {
      console.error("Error fetching tax data:", err);
      setError("Failed to load tax summary. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [period, selectedYear, customFrom, customTo]);

  useEffect(() => {
    fetchTaxData();
  }, [fetchTaxData]);

  const handleDownload = () => {
    if (!taxData) return;
    const blob = new Blob([JSON.stringify(taxData, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tax-report-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  const vatChartData = useMemo(() => {
    if (!taxData?.breakdown) return null;

    let aggregated = taxData.breakdown;

    if (chartView === "quarterly") {
      const quarters = {};
      for (const b of taxData.breakdown) {
        const d = new Date(`1 ${b.month}`);
        const q = Math.ceil((d.getMonth() + 1) / 3);
        const key = `Q${q} ${d.getFullYear()}`;
        if (!quarters[key]) quarters[key] = { income: 0, vat: 0 };
        quarters[key].income += b.income;
        quarters[key].vat += b.vat;
      }
      aggregated = Object.entries(quarters).map(([month, vals]) => ({ month, ...vals }));
    } else if (chartView === "yearly") {
      const years = {};
      for (const b of taxData.breakdown) {
        const d = new Date(`1 ${b.month}`);
        const key = `${d.getFullYear()}`;
        if (!years[key]) years[key] = { income: 0, vat: 0 };
        years[key].income += b.income;
        years[key].vat += b.vat;
      }
      aggregated = Object.entries(years).map(([month, vals]) => ({ month, ...vals }));
    }

    return {
      labels: aggregated.map((b) => b.month),
      datasets: [
        {
          label: "Income (₦)",
          data: aggregated.map((b) => b.income),
          borderColor: "#1E40AF",
          backgroundColor: "rgba(59,130,246,0.2)",
          tension: 0.3,
        },
        {
          label: "VAT (₦)",
          data: aggregated.map((b) => b.vat),
          borderColor: "#16A34A",
          backgroundColor: "rgba(34,197,94,0.2)",
          tension: 0.3,
        },
      ],
    };
  }, [taxData, chartView]);

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-screen-xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-bold text-blue-800">
              M&M Fashion — Tax Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Financial overview & compliance summary under the Nigeria Finance Act
            </p>
          </header>

          {/* Period Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 px-6 py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="border border-blue-200 px-3 py-1.5 rounded-md focus:ring-2 focus:ring-blue-400 text-sm"
                >
                  {periodOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {period === "specific-year" && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="border border-blue-200 px-3 py-1.5 rounded-md focus:ring-2 focus:ring-blue-400 text-sm"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              )}

              {period === "custom" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="border border-blue-200 px-3 py-1.5 rounded-md text-sm focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="border border-blue-200 px-3 py-1.5 rounded-md text-sm focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <p className="text-gray-500 text-center">Loading tax data...</p>
          ) : error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : !taxData ? (
            <p className="text-gray-500 text-center">No tax data available.</p>
          ) : (
            <>
              {/* === Summary Boxes === */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                <StatBox
                  label="Revenue Band"
                  value={taxData.band || "—"}
                  color="from-blue-100 to-blue-200"
                />
                <StatBox
                  label="CIT Rate"
                  value={`${taxData.citRate ?? 0}%`}
                  color="from-sky-100 to-sky-200"
                />
                <StatBox
                  label="VAT on Sales"
                  value={`₦${(taxData.vatOnSales || 0).toLocaleString()}`}
                  color="from-indigo-100 to-indigo-200"
                />
                <StatBox
                  label="CIT Payable"
                  value={`₦${(taxData.companyIncomeTax || 0).toLocaleString()}`}
                  color="from-blue-100 to-blue-200"
                />
              </div>

              {/* === Details === */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <DetailBox label="Total Revenue" value={`₦${Number(taxData.totalRevenue || 0).toLocaleString()}`} />
                <DetailBox label="COGS" value={`₦${Number(taxData.cogs || 0).toLocaleString()}`} />
                <DetailBox label="Operating Expenses" value={`₦${Number(taxData.operatingExpenses || 0).toLocaleString()}`} />
                <DetailBox label="Gross Profit" value={`₦${Number(taxData.grossProfit || 0).toLocaleString()}`} />
                <DetailBox label="Taxable Income" value={`₦${Number(taxData.taxableIncome || 0).toLocaleString()}`} />
                <DetailBox
                  label="Generated On"
                  value={new Date(taxData.generatedAt).toLocaleString()}
                />
              </div>

              {/* === Chart === */}
              {vatChartData && (
                <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h2 className="text-xl font-semibold text-blue-800">
                      Income & VAT Trend
                    </h2>
                    <div className="flex gap-1 bg-blue-50 rounded-lg p-1">
                      {[
                        { label: "Monthly", value: "monthly" },
                        { label: "Quarterly", value: "quarterly" },
                        { label: "Yearly", value: "yearly" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setChartView(opt.value)}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                            chartView === opt.value
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-blue-700 hover:bg-blue-100"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Line data={vatChartData} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
                </div>
              )}

              {/* === Table === */}
              {Array.isArray(taxData.breakdown) && taxData.breakdown.length > 0 && (
                <div className="bg-white border border-blue-100 rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-semibold mb-4 text-blue-800">
                    VAT Breakdown by Month
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                      <thead>
                        <tr className="bg-blue-100 text-blue-800 uppercase text-xs tracking-wider">
                          <th className="py-2 px-4">Month</th>
                          <th className="py-2 px-4">Income (₦)</th>
                          <th className="py-2 px-4">VAT (₦)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taxData.breakdown.map((item, idx) => (
                          <tr key={idx} className="border-b hover:bg-blue-50 transition">
                            <td className="py-2 px-4 font-medium text-gray-700">{item.month}</td>
                            <td className="py-2 px-4 text-gray-600">₦{Number(item.income || 0).toLocaleString()}</td>
                            <td className="py-2 px-4 text-gray-600">₦{Number(item.vat || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* === Download Button === */}
              <div className="flex justify-end">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-xl shadow-md transition"
                >
                  Download Tax Report
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

/* === Subcomponents === */
function StatBox({ label, value, color }) {
  return (
    <div
      className={`bg-white ${color} border border-blue-100 p-5 rounded-xl shadow-sm flex flex-col items-start`}
    >
      <p className="text-sm font-medium text-blue-700 mb-2">{label}</p>
      <p className="text-xl font-bold text-blue-900">{value}</p>
    </div>
  );
}

function DetailBox({ label, value }) {
  return (
    <div className="bg-white border border-blue-100 rounded-xl shadow-sm p-5">
      <p className="text-sm text-blue-700">{label}</p>
      <p className="text-2xl font-bold text-blue-900">{value}</p>
    </div>
  );
}
