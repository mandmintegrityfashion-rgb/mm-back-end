"use client";

import Layout from "@/components/Layout";
import { useState, useEffect } from "react";

export default function StockManagement() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");

        const data = await res.json();
        setProducts(Array.isArray(data) ? data : data.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      }
    }

    fetchProducts();
  }, []);

  const filteredItems = products.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStock = products.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalIncoming = 240; // Placeholder
  const totalOutgoing = 85; // Placeholder
  const lowStockCount = products.filter((p) => p.quantity < (p.minStock || 10)).length;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
        {/* Header */}
        <header className="mb-10 text-start">
          <h1 className="text-4xl font-extrabold text-blue-900 mb-2 tracking-tight">
            M&M Fashion — Stock Management
          </h1>
          <p className="text-gray-600 text-sm">
            Monitor and control your fashion inventory with elegance.
          </p>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard label="Total Stock" value={`${totalStock} units`} />
          <StatCard label="Incoming Stock" value={`${totalIncoming} units`} />
          <StatCard label="Outgoing Stock" value={`${totalOutgoing} units`} />
          <StatCard label="Low Stock Alerts" value={lowStockCount} highlight />
        </section>

        {/* Search */}
        <div className="mb-8 flex justify-start">
          <input
            type="text"
            placeholder="Search by product or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-2/3 lg:w-1/2 px-4 py-2.5 border border-blue-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400 text-gray-700"
          />
        </div>

        {/* Table */}
        <section className="overflow-x-auto bg-white rounded-2xl shadow-lg border border-blue-100">
          <table className="min-w-full divide-y divide-blue-100">
            <thead className="bg-blue-100/50 text-blue-900 uppercase text-xs font-semibold tracking-wide">
              <tr>
                {["Name", "Category", "Stock Qty", "Unit Cost", "Status"].map((header) => (
                  <th key={header} className="px-6 py-3 text-left">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 italic">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((product) => {
                  const status =
                    product.quantity === 0
                      ? "Out of Stock"
                      : product.quantity < (product.minStock || 10)
                      ? "Low Stock"
                      : "In Stock";

                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-blue-50/70 transition-all duration-150"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                        {product.quantity ?? 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        ₦{(product.costPrice || 0).toLocaleString()}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm font-semibold ${
                          status === "In Stock"
                            ? "text-green-600"
                            : status === "Low Stock"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {status}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, highlight = false }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center border-t-4 ${
        highlight ? "border-blue-400" : "border-transparent"
      } hover:shadow-lg transition-all duration-200`}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-blue-900">{value}</p>
    </div>
  );
}
