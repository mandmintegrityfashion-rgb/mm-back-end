"use client";
import Layout from "@/components/Layout";
import Link from "next/link";
import { useEffect, useState } from "react";

const locations = ["* All Locations", "Warehouse A", "Warehouse B", "Storefront"];
const reasons = ["* All Reasons", "Restock", "Return", "Transfer", "Adjustment"];
const statuses = ["All Statuses", "Pending", "Received", "Cancelled"];

export default function StockMovement() {
  const [movements, setMovements] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [location, setLocation] = useState(locations[0]);
  const [reason, setReason] = useState(reasons[0]);
  const [status, setStatus] = useState(statuses[0]);
  const [barcode, setBarcode] = useState("");

  useEffect(() => {
    async function fetchStockMovements() {
      try {
        const res = await fetch("../../api/stock-movement/get");
        const data = await res.json();
        setMovements(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching stock movements:", err);
        setMovements([]);
      }
    }

    fetchStockMovements();
  }, []);

  const parseDate = (dateStr) => (dateStr ? new Date(dateStr) : null);

  const filteredMovements = movements.filter((item) => {
    if (location !== "* All Locations" && item.sender !== location) return false;
    if (reason !== "* All Reasons" && item.reason !== reason) return false;
    if (status !== "All Statuses" && item.status !== status) return false;
    if (barcode && !item.barcode?.includes(barcode)) return false;
    if (fromDate) {
      const from = parseDate(fromDate);
      const dateSent = parseDate(item.dateSent);
      if (!dateSent || dateSent < from) return false;
    }
    if (toDate) {
      const to = parseDate(toDate);
      const dateSent = parseDate(item.dateSent);
      if (!dateSent || dateSent > to) return false;
    }
    return true;
  });

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-blue-100 p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 tracking-tight">
              M&M Fashion Stock Movements
            </h1>
            <p className="text-sm text-blue-600 mt-1">
              Manage and track all stock transfers across stores and warehouses.
            </p>
          </div>

          <Link href="../stock/add">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200">
              + ADD STOCK MOVEMENT
            </button>
          </Link>
        </div>

        {/* Filters - Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-md mb-4 border border-blue-100">
          <div>
            <label className="block text-sm font-semibold text-blue-900 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-blue-900 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>
        </div>

        {/* Filters - Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-xl shadow-md mb-6 border border-blue-100">
          <div>
            <label className="block text-sm font-semibold text-blue-900 mb-2">
              Filter by Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-blue-900 mb-2">
              Filter by Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            >
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-blue-900 mb-2">
              Filter by Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Barcode Search */}
        <div className="flex flex-col md:flex-row md:items-end gap-4 bg-white p-6 rounded-xl shadow-md mb-8 border border-blue-100">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-blue-900 mb-2">
              Scan or Enter Order Barcode
            </label>
            <input
              type="text"
              placeholder="Scan barcode here"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>

          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2 rounded-lg shadow-sm transition-all duration-200">
            SEARCH
          </button>
        </div>

        {/* Movements Table */}
        <div className="bg-white rounded-xl shadow-md overflow-x-auto border border-blue-100">
          <table className="min-w-full text-sm text-gray-800">
            <thead className="bg-blue-100 text-blue-900">
              <tr>
                {[
                  "TRANS REF.",
                  "FROM",
                  "TO",
                  "DATE SENT",
                  "DATE RECEIVED",
                  "TOTAL COST PRICE",
                  "STATUS",
                  "",
                ].map((head) => (
                  <th
                    key={head}
                    className="text-left px-6 py-3 font-semibold uppercase tracking-wide text-xs"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-gray-500 px-6 py-6">
                    No stock movements found
                  </td>
                </tr>
              ) : (
                filteredMovements.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b hover:bg-blue-50 transition duration-150"
                  >
                    <td className="px-6 py-3 font-semibold text-blue-800">
                      {item.transRef}
                    </td>
                    <td className="px-6 py-3">{item.sender}</td>
                    <td className="px-6 py-3">{item.receiver}</td>
                    <td className="px-6 py-3">
                      {new Date(item.dateSent).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      {item.dateReceived
                        ? new Date(item.dateReceived).toLocaleString()
                        : "---"}
                    </td>
                    <td className="px-6 py-3 font-medium">
                      ₦
                      {item.totalCostPrice?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className={`px-6 py-3 font-semibold ${
                        item.status === "Received"
                          ? "text-green-600"
                          : item.status === "Pending"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {item.status}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link href={`/stock/movement/${item._id}`}>
                        <span className="inline-block bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium px-3 py-1 rounded-lg text-xs shadow-sm transition duration-150">
                          VIEW DETAILS
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
