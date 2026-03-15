import Layout from "@/components/Layout";
import { useState } from "react";

const DEDUCTION_OPTIONS = [
  "NHF (Housing Fund)",
  "NHIS (Health Insurance)",
  "Life Assurance Premium",
  "Voluntary Pension",
  "Others",
];

export default function PersonalTaxCalculator() {
  const [mode, setMode] = useState("yearly");
  const [grossIncome, setGrossIncome] = useState("");
  const [pension, setPension] = useState("");
  const [selectedDeduction, setSelectedDeduction] = useState("");
  const [deductionAmount, setDeductionAmount] = useState("");
  const [deductions, setDeductions] = useState([]);
  const [result, setResult] = useState(null);

  const formatCurrency = (num) =>
    "₦" + Number(num).toLocaleString(undefined, { minimumFractionDigits: 2 });

  const addDeduction = () => {
    if (!selectedDeduction || !deductionAmount) return;
    setDeductions((prev) => [
      ...prev,
      { name: selectedDeduction, amount: parseFloat(deductionAmount) },
    ]);
    setDeductionAmount("");
    setSelectedDeduction("");
  };

  const calculateTax = () => {
    const multiplier = mode === "monthly" ? 12 : 1;
    const gross = parseFloat(grossIncome || 0) * multiplier;
    const pensionDeduction = parseFloat(pension || 0) * multiplier;
    const totalOtherDeductions =
      deductions.reduce((sum, d) => sum + d.amount, 0) * multiplier;

    const onePercent = gross * 0.01;
    const cra = Math.max(200000, onePercent) + gross * 0.2;
    const taxableIncome = Math.max(
      0,
      gross - pensionDeduction - totalOtherDeductions - cra
    );

    let remaining = taxableIncome;
    let tax = 0;

    const bands = [
      { limit: 300000, rate: 0.07 },
      { limit: 300000, rate: 0.11 },
      { limit: 500000, rate: 0.15 },
      { limit: 500000, rate: 0.19 },
      { limit: 1600000, rate: 0.21 },
      { limit: Infinity, rate: 0.24 },
    ];

    for (const band of bands) {
      if (remaining <= 0) break;
      const bandAmount = Math.min(remaining, band.limit);
      tax += bandAmount * band.rate;
      remaining -= bandAmount;
    }

    setResult({
      mode,
      gross,
      pension: pensionDeduction,
      other: totalOtherDeductions,
      cra,
      taxableIncome,
      yearlyTax: tax,
      monthlyTax: tax / 12,
      allDeductions: deductions,
    });
  };

  return (
    <Layout>
      <div className="p-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
        <div className="max-w-screen-xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-bold text-blue-800">
              M&M Fashion — Personal Tax Calculator
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Compute your personal income tax according to the Nigeria Finance Act.
            </p>
          </header>

          {/* Mode Selection */}
          <div className="bg-white shadow-sm border border-blue-100 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-3">
              Salary Input Mode
            </h2>
            <div className="flex gap-6">
              {["monthly", "yearly"].map((m) => (
                <label key={m} className="inline-flex items-center text-blue-700 font-medium">
                  <input
                    type="radio"
                    value={m}
                    checked={mode === m}
                    onChange={() => setMode(m)}
                    className="mr-2 accent-blue-600"
                  />
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputBox
              label={`Gross ${mode === "monthly" ? "Monthly" : "Annual"} Income (₦)`}
              placeholder="e.g. 500000"
              value={grossIncome}
              onChange={(e) => setGrossIncome(e.target.value)}
            />
            <InputBox
              label={`Pension Contribution (${mode})`}
              placeholder="e.g. 40000"
              value={pension}
              onChange={(e) => setPension(e.target.value)}
            />
          </div>

          {/* Deduction Section */}
          <div className="bg-white shadow-sm border border-blue-100 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-4">Other Deductions</h2>
            <div className="flex flex-wrap gap-4 items-center">
              <select
                value={selectedDeduction}
                onChange={(e) => setSelectedDeduction(e.target.value)}
                className="border border-blue-200 px-3 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300"
              >
                <option value="">Select Deduction</option>
                {DEDUCTION_OPTIONS.map((opt, i) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Amount"
                value={deductionAmount}
                onChange={(e) => setDeductionAmount(e.target.value)}
                className="border border-blue-200 px-3 py-2 rounded-lg w-40 shadow-sm focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={addDeduction}
                className="bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition shadow"
              >
                Add
              </button>
            </div>

            {deductions.length > 0 && (
              <ul className="mt-4 space-y-1 text-sm text-blue-900 list-disc list-inside">
                {deductions.map((d, i) => (
                  <li key={i}>
                    {d.name}:{" "}
                    {formatCurrency(d.amount * (mode === "monthly" ? 12 : 1))}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Calculate Button */}
          <div>
            <button
              onClick={calculateTax}
              className="bg-blue-700 text-white font-semibold px-10 py-3 rounded-xl hover:bg-blue-800 transition shadow-lg"
            >
              Calculate My Tax
            </button>
          </div>

          {/* Result Section */}
          {result && (
            <div className="bg-white shadow-sm border border-blue-100 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-blue-800 mb-5">
                Tax Summary ({mode === "monthly" ? "Monthly" : "Yearly"} Input)
              </h2>
              <ul className="space-y-3 text-blue-900 leading-relaxed">
                <li>
                  <strong>Total Gross Income:</strong> {formatCurrency(result.gross)}
                </li>
                <li>
                  <strong>Pension Contribution:</strong> {formatCurrency(result.pension)}
                </li>
                <li>
                  <strong>Other Deductions:</strong> {formatCurrency(result.other)}
                </li>
                <li>
                  <strong>Consolidated Relief Allowance (CRA):</strong> {formatCurrency(result.cra)}
                </li>
                <li className="border-t border-blue-100 pt-2">
                  <strong>Taxable Income:</strong> {formatCurrency(result.taxableIncome)}
                </li>
                <li>
                  <strong>Estimated Yearly Tax:</strong> {formatCurrency(result.yearlyTax)}
                </li>
                {mode === "monthly" && (
                  <li>
                    <strong>Estimated Monthly Tax:</strong> {formatCurrency(result.monthlyTax)}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function InputBox({ label, placeholder, value, onChange }) {
  return (
    <div className="text-left">
      <label className="block font-semibold text-blue-800 mb-1">{label}</label>
      <input
        type="number"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full border border-blue-200 px-4 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
      />
    </div>
  );
}
