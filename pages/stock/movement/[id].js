"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";

export default function MovementDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [movement, setMovement] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;
    const movementId = router.query.id;

    async function fetchMovement() {
      try {
        const res = await fetch(`/api/stock-movement/${movementId}`);
        const data = await res.json();
        setMovement(data);
      } catch (err) {
        console.error("Failed to fetch movement:", err);
      }
    }

    fetchMovement();
  }, [router.isReady, router.query.id]);

  function exportToCSV() {
    if (!movement || !Array.isArray(movement.products)) return;

    const rows = [["Product", "Cost Price", "Quantity", "Subtotal"]];
    movement.products.forEach((p) => {
      const name = p?.id?.name || "N/A";
      const cost = p?.id?.costPrice || 0;
      const qty = p.quantity || 0;
      const subtotal = cost * qty;
      rows.push([name, cost, qty, subtotal]);
    });

    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock_movement_${id}.csv`;
    link.click();
  }

  function exportToExcel() {
    const html = document.getElementById("movement-report")?.outerHTML || "";
    const blob = new Blob([html], {
      type: "application/vnd.ms-excel",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stock_movement_${id}.xls`;
    link.click();
  }

  if (!movement)
    return (
      <Layout>
        <div className="p-8 text-gray-600 text-center">Loading movement details...</div>
      </Layout>
    );

  const totalCost =
    typeof movement.totalCostPrice === "number"
      ? movement.totalCostPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })
      : "0.00";

  const products = Array.isArray(movement.products) ? movement.products : [];

  return (
    <Layout>
      <div className="min-h-screen bg-[#f5f9fc] p-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">
              M&M Fashion — Stock Movement Details
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Review and manage this stock movement record.
            </p>
          </div>
          <button className="mt-4 sm:mt-0 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-md text-sm font-semibold shadow">
            PRINT LABELS
          </button>
        </div>

        {/* Movement Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 mb-8">
          <div className="p-4 bg-blue-50 border-b border-blue-100 text-blue-900 font-semibold text-sm uppercase tracking-wide">
            Stock Movement Information
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <strong className="text-gray-800">From Location:</strong>{" "}
              {movement.fromLocation}
            </div>
            <div>
              <strong className="text-gray-800">To Location:</strong>{" "}
              {movement.toLocation}
            </div>
            <div>
              <strong className="text-gray-800">Ref. Number:</strong>{" "}
              <div className="font-mono text-lg text-blue-700 mt-1">
                *{movement.transRef}*
              </div>
            </div>
            <div>
              <strong className="text-gray-800">Reason:</strong> {movement.reason}
            </div>
            <div>
              <strong className="text-gray-800">Staff Sent:</strong> {movement.staff}
            </div>
            <div>
              <strong className="text-gray-800">Date Sent:</strong>{" "}
              {new Date(movement.dateSent).toLocaleString()}
            </div>
            <div>
              <strong className="text-gray-800">Status:</strong>{" "}
              <span
                className={`font-semibold ${
                  movement.status === "Received"
                    ? "text-green-600"
                    : "text-blue-600"
                }`}
              >
                {movement.status}
              </span>
            </div>
            <div>
              <strong className="text-gray-800">Staff Received:</strong>{" "}
              {movement.staff}
            </div>
            <div>
              <strong className="text-gray-800">Date Received:</strong>{" "}
              {movement.dateReceived
                ? new Date(movement.dateReceived).toLocaleString()
                : "---"}
            </div>
            <div>
              <strong className="text-gray-800">Note:</strong> —
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div
          id="movement-report"
          className="bg-white rounded-xl shadow-sm border border-blue-100 p-4 mb-8 overflow-x-auto"
        >
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-blue-50 text-blue-900 font-semibold">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Unit Cost Price</th>
                <th className="px-4 py-3">Sent</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3 text-right">Total Cost Price</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, idx) => {
                const name = p?.id?.name || "N/A";
                const cost = p?.id?.costPrice || 0;
                const qty = p.quantity || 0;
                const subtotal = cost * qty;
                return (
                  <tr
                    key={idx}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-blue-50/40"
                    } border-t border-blue-100`}
                  >
                    <td className="px-4 py-3">{name}</td>
                    <td className="px-4 py-3">₦{cost.toLocaleString()}</td>
                    <td className="px-4 py-3">{qty}</td>
                    <td className="px-4 py-3">{qty}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                      ₦{subtotal.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-blue-600 text-white font-semibold">
                <td className="px-4 py-3" colSpan={4}>
                  Total:
                </td>
                <td className="px-4 py-3 text-right">₦{totalCost}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => router.push("/stock/movement")}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm transition"
          >
            ← Back
          </button>
          <button
            onClick={() => router.push(`/stock/movement/edit/${id}`)}
            className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800 text-sm font-semibold transition"
          >
            Edit / Receive
          </button>
          <button
            onClick={exportToCSV}
            className="border border-blue-200 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-50 text-sm transition"
          >
            Export CSV
          </button>
          <button
            onClick={exportToExcel}
            className="border border-blue-200 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-50 text-sm transition"
          >
            Export Excel
          </button>
          <button
            onClick={() => window.print()}
            className="border border-blue-200 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-50 text-sm transition"
          >
            Print
          </button>
        </div>
      </div>
    </Layout>
  );
}
