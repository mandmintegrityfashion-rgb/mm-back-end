import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faScaleBalanced,
  faMoneyBillWave,
  faFileDownload,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";

const getTaxBand = (revenue) => {
  if (revenue <= 25_000_000) return { band: "Small", rate: 0 };
  if (revenue <= 100_000_000) return { band: "Medium", rate: 20 };
  return { band: "Large", rate: 30 };
};

export default function TaxAnalysisPage() {
  const [taxData, setTaxData] = useState(null);

  useEffect(() => {
    const mockRevenue = 78_500_000;
    const taxBandInfo = getTaxBand(mockRevenue);
    const vatRate = 7.5;

    const taxableIncome = mockRevenue * 0.85;
    const companyIncomeTax = (taxableIncome * taxBandInfo.rate) / 100;
    const vatOnSales = (mockRevenue * vatRate) / 100;

    setTaxData({
      totalRevenue: mockRevenue,
      band: taxBandInfo.band,
      citRate: taxBandInfo.rate,
      taxableIncome,
      companyIncomeTax,
      vatOnSales,
      breakdown: [
        { month: "January", income: 8000000, vat: 600000 },
        { month: "February", income: 5200000, vat: 390000 },
        { month: "March", income: 4500000, vat: 337500 },
      ],
    });
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-blue-800 tracking-tight">
              M&M Fashion Tax Dashboard
            </h1>
            <p className="text-gray-500 mt-2">
              Financial overview & compliance summary under Nigeria Finance Act
            </p>
          </header>

          {!taxData ? (
            <p className="text-gray-500 text-center">Loading tax data...</p>
          ) : (
            <>
              {/* Stat Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-10">
                <StatBox
                  icon={faScaleBalanced}
                  label="Revenue Band"
                  value={taxData.band}
                  color="from-blue-100 to-blue-200"
                />
                <StatBox
                  icon={faChartLine}
                  label="CIT Rate"
                  value={`${taxData.citRate}%`}
                  color="from-sky-100 to-sky-200"
                />
                <StatBox
                  icon={faMoneyBillWave}
                  label="VAT on Sales"
                  value={`₦${taxData.vatOnSales.toLocaleString()}`}
                  color="from-indigo-100 to-indigo-200"
                />
                <StatBox
                  icon={faMoneyBillWave}
                  label="CIT Payable"
                  value={`₦${taxData.companyIncomeTax.toLocaleString()}`}
                  color="from-blue-100 to-blue-200"
                />
              </div>

              {/* Summary Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                <DetailBox
                  label="Total Revenue"
                  value={`₦${taxData.totalRevenue.toLocaleString()}`}
                />
                <DetailBox
                  label="Estimated Taxable Income"
                  value={`₦${taxData.taxableIncome.toLocaleString()}`}
                />
              </div>

              {/* Breakdown Table */}
              <div className="bg-white/70 backdrop-blur-lg border border-blue-100 rounded-2xl shadow-sm p-6 mb-10">
                <h2 className="text-2xl font-semibold mb-4 text-blue-800">
                  Monthly VAT Breakdown
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left">
                    <thead>
                      <tr className="bg-blue-100 text-blue-800 uppercase text-xs tracking-wider">
                        <th className="py-2 px-4 rounded-l-lg">Month</th>
                        <th className="py-2 px-4">Income (₦)</th>
                        <th className="py-2 px-4 rounded-r-lg">VAT (₦)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxData.breakdown.map((item, index) => (
                        <tr
                          key={index}
                          className="border-b border-blue-50 hover:bg-blue-50 transition"
                        >
                          <td className="py-2 px-4 font-medium text-gray-700">
                            {item.month}
                          </td>
                          <td className="py-2 px-4 text-gray-600">
                            {item.income.toLocaleString()}
                          </td>
                          <td className="py-2 px-4 text-gray-600">
                            {item.vat.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Download Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => alert('Tax Report downloaded')}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl shadow-md transition"
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
