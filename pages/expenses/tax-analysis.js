"use client";

import Layout from "@/components/Layout";
import { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faScaleBalanced,
  faMoneyBillWave,
  faFileDownload,
  faChartLine,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
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

  useEffect(() => {
    async function fetchTaxData() {
      try {
        const res = await fetch("/api/tax/summary");
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        setTaxData(data);
      } catch (err) {
        console.error("❌ Error fetching tax data:", err);
        setError("Failed to load tax summary. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchTaxData();
  }, []);

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
    return {
      labels: taxData.breakdown.map((b) => b.month),
      datasets: [
        {
          label: "Income (₦)",
          data: taxData.breakdown.map((b) => b.income),
          borderColor: "#1E40AF",
          backgroundColor: "rgba(59,130,246,0.2)",
          tension: 0.3,
        },
        {
          label: "VAT (₦)",
          data: taxData.breakdown.map((b) => b.vat),
          borderColor: "#16A34A",
          backgroundColor: "rgba(34,197,94,0.2)",
          tension: 0.3,
        },
      ],
    };
  }, [taxData]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <header className="mb-10 text-center">
            <h1 className="text-4xl font-bold text-blue-800">
              M&M Fashion — Tax Dashboard
            </h1>
            <p className="text-gray-500 mt-2">
              Financial overview & compliance summary under the Nigeria Finance Act
            </p>
          </header>

          {loading ? (
            <p className="text-gray-500 text-center">Loading tax data...</p>
          ) : error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : !taxData ? (
            <p className="text-gray-500 text-center">No tax data available.</p>
          ) : (
            <>
              {/* === Summary Boxes === */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-10">
                <StatBox
                  icon={faScaleBalanced}
                  label="Revenue Band"
                  value={taxData.band || "—"}
                  color="from-blue-100 to-blue-200"
                />
                <StatBox
                  icon={faChartLine}
                  label="CIT Rate"
                  value={`${taxData.citRate ?? 0}%`}
                  color="from-sky-100 to-sky-200"
                />
                <StatBox
                  icon={faMoneyBillWave}
                  label="VAT on Sales"
                  value={`₦${(taxData.vatOnSales || 0).toLocaleString()}`}
                  color="from-indigo-100 to-indigo-200"
                />
                <StatBox
                  icon={faMoneyBillWave}
                  label="CIT Payable"
                  value={`₦${(taxData.companyIncomeTax || 0).toLocaleString()}`}
                  color="from-blue-100 to-blue-200"
                />
              </div>

              {/* === Details === */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                <DetailBox label="Total Revenue" value={`₦${taxData.totalRevenue.toLocaleString()}`} />
                <DetailBox label="COGS" value={`₦${taxData.cogs.toLocaleString()}`} />
                <DetailBox label="Operating Expenses" value={`₦${taxData.operatingExpenses.toLocaleString()}`} />
                <DetailBox label="Gross Profit" value={`₦${taxData.grossProfit.toLocaleString()}`} />
                <DetailBox label="Taxable Income" value={`₦${taxData.taxableIncome.toLocaleString()}`} />
                <DetailBox
                  label="Generated On"
                  value={new Date(taxData.generatedAt).toLocaleString()}
                />
              </div>

              {/* === Chart === */}
              {vatChartData && (
                <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-blue-100 shadow-sm mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <FontAwesomeIcon icon={faCircleInfo} className="text-blue-700" />
                    <h2 className="text-xl font-semibold text-blue-800">
                      Monthly Income & VAT Trend
                    </h2>
                  </div>
                  <Line data={vatChartData} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
                </div>
              )}

              {/* === Table === */}
              {Array.isArray(taxData.breakdown) && taxData.breakdown.length > 0 && (
                <div className="bg-white/80 border border-blue-100 rounded-2xl shadow p-6 mb-10">
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
                            <td className="py-2 px-4 text-gray-600">{item.income.toLocaleString()}</td>
                            <td className="py-2 px-4 text-gray-600">{item.vat.toLocaleString()}</td>
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
                  <FontAwesomeIcon icon={faFileDownload} />
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
function StatBox({ icon, label, value, color }) {
  return (
    <div
      className={`bg-gradient-to-br ${color} border border-blue-100 p-5 rounded-2xl shadow-sm flex flex-col items-start`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="text-lg text-blue-800 bg-white p-2 rounded-lg shadow-sm">
          <FontAwesomeIcon icon={icon} />
        </div>
        <p className="text-sm font-medium text-blue-700">{label}</p>
      </div>
      <p className="text-xl font-bold text-blue-900">{value}</p>
    </div>
  );
}

function DetailBox({ label, value }) {
  return (
    <div className="bg-white/80 backdrop-blur-lg border border-blue-100 rounded-2xl shadow-sm p-5">
      <p className="text-sm text-blue-700">{label}</p>
      <p className="text-2xl font-bold text-blue-900">{value}</p>
    </div>
  );
}
