"use client";

import Layout from "@/components/Layout";
import { useEffect, useState, useRef, useCallback } from "react";
import { saveAs } from "file-saver";

export default function SalesReport() {
  const [transactions, setTransactions] = useState([]);
  const [expandedTxId, setExpandedTxId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20); // lazy load step
  const observerRef = useRef(null);

  // ---- Load cached filters & transactions ----
  const fetchTransactions = useCallback(async ({
    selectedDate: selectedDateFilter = null,
    minAmount: minAmountFilter = "",
    maxAmount: maxAmountFilter = "",
  } = {}) => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/transactions");
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      let filtered = data.transactions || [];

      if (selectedDateFilter) {
        const target = new Date(selectedDateFilter).toDateString();
        filtered = filtered.filter(
          (tx) => new Date(tx.createdAt).toDateString() === target
        );
      }

      if (minAmountFilter) filtered = filtered.filter((tx) => tx.total >= +minAmountFilter);
      if (maxAmountFilter) filtered = filtered.filter((tx) => tx.total <= +maxAmountFilter);

      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setTransactions(filtered);
      localStorage.setItem("mm_transactions", JSON.stringify(filtered));
      localStorage.setItem("mm_last_fetch", Date.now());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cachedFilters = JSON.parse(localStorage.getItem("mm_filters"));
    const cachedTx = JSON.parse(localStorage.getItem("mm_transactions"));
    const lastFetch = localStorage.getItem("mm_last_fetch");
    const lastExpanded = localStorage.getItem("mm_last_expanded");
    const initialFilters = {
      selectedDate: cachedFilters?.selectedDate || null,
      minAmount: cachedFilters?.minAmount || "",
      maxAmount: cachedFilters?.maxAmount || "",
    };

    if (cachedFilters) {
      setSelectedDate(cachedFilters.selectedDate);
      setMinAmount(cachedFilters.minAmount);
      setMaxAmount(cachedFilters.maxAmount);
    }

    if (lastExpanded) setExpandedTxId(lastExpanded);

    // Use cache if less than 24 hours old
    if (cachedTx && lastFetch && Date.now() - lastFetch < 86400000) {
      setTransactions(cachedTx);
    } else {
      fetchTransactions(initialFilters);
    }
  }, [fetchTransactions]);

  // ---- Re-fetch when filters change ----
  useEffect(() => {
    localStorage.setItem(
      "mm_filters",
      JSON.stringify({ selectedDate, minAmount, maxAmount })
    );
    fetchTransactions({ selectedDate, minAmount, maxAmount });
  }, [selectedDate, minAmount, maxAmount, fetchTransactions]);

  // ---- Expand or collapse details ----
  const toggleDetails = (id) => {
    const newId = expandedTxId === id ? null : id;
    setExpandedTxId(newId);
    if (newId) localStorage.setItem("mm_last_expanded", newId);
    else localStorage.removeItem("mm_last_expanded");
  };

  // ---- CSV Export ----
  const exportCSV = () => {
    const headers = [
      "Date,Customer,Discount,Reason,Total,Tender,Change",
    ];
    const rows = transactions.map((tx) =>
      [
        new Date(tx.createdAt).toLocaleString(),
        tx.customerName || "N/A",
        tx.discount,
        tx.discountReason,
        tx.total,
        tx.tenderType,
        tx.change,
      ].join(",")
    );
    const csv = headers.concat(rows).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "M&M_Fashion_Transactions.csv");
  };

  const handlePrint = () => window.print();

  // ---- Lazy loading setup ----
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < transactions.length) {
          setVisibleCount((prev) => prev + 20);
        }
      },
      { threshold: 1 }
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [transactions, visibleCount]);

  // ---- Calendar ----
  const today = new Date();
  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();
  const firstDay = new Date(currentYear, currentMonthIndex, 1);
  const lastDay = new Date(currentYear, currentMonthIndex + 1, 0);
  const startDay = (firstDay.getDay() + 6) % 7; // Start Monday

  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(currentYear, currentMonthIndex, d));
  }

  return (
    <Layout title="M&M Fashion Sales Report">
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-screen-xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-blue-800">
            M&M Fashion — Sales Report
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Filter by date or amount, export or print your records with ease.
          </p>
        </header>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          {/* Calendar */}
          <div className="bg-white rounded-xl border border-blue-100 shadow-sm w-fit p-4">
            <div className="flex justify-between items-center mb-2">
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                  )
                }
                className="text-blue-600 hover:text-blue-800 px-2 text-lg"
              >
                ⬅
              </button>
              <h2 className="text-sm font-semibold text-blue-700">
                {currentMonth.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                  )
                }
                className="text-blue-600 hover:text-blue-800 px-2 text-lg"
              >
                ➡
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-sm text-center text-gray-600">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="font-medium text-blue-700">
                  {d}
                </div>
              ))}

              {days.map((date, i) => {
                if (!date) return <div key={`empty-${i}`} />;
                const dateString = date.toISOString().split("T")[0];
                const isSelected = selectedDate === dateString;
                const isToday =
                  date.toDateString() === today.toDateString();
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(dateString)}
                    className={`rounded-lg px-2 py-1 font-medium transition-all duration-200
                      ${
                        isSelected
                          ? "bg-blue-600 text-white shadow"
                          : isToday
                          ? "border border-blue-400 text-blue-700 bg-blue-50"
                          : "hover:bg-blue-100 text-blue-700"
                      }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Filters */}
          <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-4 flex-1">
            <h2 className="text-sm font-semibold text-blue-700 mb-2">
              Filter by Amount
            </h2>
            <div className="flex flex-col gap-3">
              <input
                type="number"
                placeholder="Min ₦"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-full border border-blue-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
              />
              <input
                type="number"
                placeholder="Max ₦"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-full border border-blue-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </div>
          </div>

          {/* Export */}
          <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-4 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-blue-700">
              Export Options
            </h2>
            <button
              onClick={exportCSV}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition duration-150"
            >
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition duration-150"
            >
              Print Page
            </button>
          </div>
        </div>

        {/* Table */}
        <div
          id="print-section"
          className="overflow-x-auto bg-white rounded-xl shadow-sm border border-blue-100"
        >
          {loading ? (
            <div className="p-6 text-center text-blue-600">Loading transactions...</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-blue-100 text-blue-900">
                <tr>
                  <th className="px-4 py-3 text-left">Date/Time</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Discount</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Tender</th>
                  <th className="px-4 py-3 text-left">Change</th>
                  <th className="px-4 py-3 text-center">Items</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-6 text-center text-gray-500"
                    >
                      No transactions found for this date or amount range.
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, visibleCount).map((tx) => (
                    <>
                      <tr
                        key={tx._id}
                        className={`border-t border-blue-50 transition ${
                          expandedTxId === tx._id
                            ? "bg-blue-100/70"
                            : "hover:bg-blue-50"
                        }`}
                      >
                        <td className="px-4 py-2">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">{tx.customerName || "N/A"}</td>
                        <td className="px-4 py-2">
                          ₦{tx.discount?.toFixed(2) || "0.00"}
                        </td>
                        <td className="px-4 py-2">{tx.discountReason || "-"}</td>
                        <td className="px-4 py-2 font-semibold text-blue-800">
                          ₦{tx.total?.toFixed(2)}
                        </td>
                        <td className="px-4 py-2">{tx.tenderType}</td>
                        <td className="px-4 py-2">
                          ₦{tx.change?.toFixed(2) || "0.00"}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            className={`${
                              expandedTxId === tx._id
                                ? "bg-blue-700"
                                : "bg-blue-500 hover:bg-blue-600"
                            } text-white px-3 py-1 rounded text-xs font-semibold transition`}
                            onClick={() => toggleDetails(tx._id)}
                          >
                            {expandedTxId === tx._id ? "Hide Items" : "View Items"}
                          </button>
                        </td>
                      </tr>
                      {expandedTxId === tx._id && (
                        <tr className="bg-blue-50/40">
                          <td colSpan={8} className="px-6 py-4">
                            <table className="w-full text-sm">
                              <thead className="bg-blue-100 text-blue-900">
                                <tr>
                                  <th className="px-3 py-2 text-left">Item</th>
                                  <th className="px-3 py-2 text-right">Qty</th>
                                  <th className="px-3 py-2 text-right">Price</th>
                                  <th className="px-3 py-2 text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tx.items?.map((item, idx) => (
                                  <tr key={idx}>
                                    <td className="px-3 py-1">{item.name}</td>
                                    <td className="px-3 py-1 text-right">
                                      {item.qty}
                                    </td>
                                    <td className="px-3 py-1 text-right">
                                      ₦{item.salePriceIncTax?.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-1 text-right font-semibold text-blue-800">
                                      ₦
                                      {(item.qty * item.salePriceIncTax).toFixed(
                                        2
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          )}
          {/* Lazy load trigger */}
          {visibleCount < transactions.length && (
            <div
              ref={observerRef}
              className="text-center py-4 text-blue-500 font-medium"
            >
              Loading more records...
            </div>
          )}
        </div>
        </div>
      </div>
    </Layout>
  );
}
