"use client";

import { useEffect, useState } from "react";
import { Search, X, Mail } from "lucide-react";
import clsx from "clsx";
import Layout from "@/components/Layout";
import axios from "axios";

export default function OrderInventoryPage() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const entriesPerPage = 10;
  const statusOptions = ["Pending", "Shipped", "Delivered"];
  const currency = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  });

  const statusClass = {
    Pending: "bg-blue-100 text-blue-700",
    Shipped: "bg-sky-100 text-sky-700",
    Delivered: "bg-green-100 text-green-700",
  };

  const fetchOrders = async (page = 1, searchTerm = "") => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/orders", {
        params: { page, limit: entriesPerPage, search: searchTerm },
      });
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
      setTotalPages(1);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders(currentPage, search);
  }, [currentPage, search]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    try {
      await axios.put(`/api/orders/${orderId}`, { status: newStatus });
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error("Failed to update status:", error);
    }
    setUpdatingStatus(false);
  };

  const handleSendEmail = async () => {
    if (!selectedOrder?.customer?.email) return;
    setSendingEmail(true);

    const customerData = {
      name: selectedOrder.customer.name || "Customer",
      orderId: selectedOrder._id,
      status: selectedOrder.status,
      total: new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(selectedOrder.total ?? 0),
      products: (selectedOrder.cartProducts || []).map((p) => ({
        name: p.name,
        quantity: p.quantity,
        price: p.price,
      })),
    };

    try {
      await axios.post("/api/send-email", {
        to: selectedOrder.customer.email,
        subject: "Your Order Details from M&M Fashion",
        customer: customerData,
      });
      setSelectedOrder(null);
    } catch (error) {
      console.error("Failed to send email:", error);
    }

    setSendingEmail(false);
  };

  return (
    <Layout>
      <div className="px-6 py-8">
        <h1 className="text-3xl font-[Playfair_Display] font-semibold text-blue-800 mb-6">
          Order Inventory
        </h1>

        {/* Search Bar */}
        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-3 top-3.5 text-blue-400 w-5 h-5" />
          <input
            type="search"
            placeholder="Search by customer or order ID"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-3 border border-blue-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-700"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-blue-100 shadow-sm">
          <table className="min-w-full text-sm sm:text-base border-collapse">
            <thead className="bg-blue-50 text-blue-800">
              <tr>
                {["Order ID", "Customer", "Total", "Status", "Date"].map((h) => (
                  <th
                    key={h}
                    className="text-left font-semibold py-3 px-4 border-b border-blue-100"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-6 text-gray-500 italic"
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-6 italic text-gray-400"
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-blue-50 cursor-pointer transition"
                  >
                    <td className="font-mono text-blue-700 px-4 py-2">
                      {order._id}
                    </td>
                    <td className="px-4 py-2">
                      {order.customer?.name || "N/A"}
                    </td>
                    <td className="font-semibold text-gray-700 px-4 py-2">
                      {currency.format(order.total ?? 0)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <select
                        value={order.status}
                        disabled={updatingStatus}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          updateStatus(order._id, e.target.value)
                        }
                        className={clsx(
                          "px-3 py-1 rounded-full text-xs font-semibold transition",
                          statusClass[order.status] ||
                            "bg-gray-100 text-gray-600"
                        )}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(order.createdAt).toLocaleDateString("en-NG")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={clsx(
                "px-3 py-1 rounded transition",
                page === currentPage
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              )}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* Order Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative shadow-lg border border-blue-100">
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
              >
                <X />
              </button>
              <h3 className="text-2xl font-[Playfair_Display] font-semibold text-blue-800 mb-4">
                Order Details
              </h3>
              <p>
                <strong>Order ID:</strong> {selectedOrder._id}
              </p>
              <p>
                <strong>Customer:</strong>{" "}
                {selectedOrder.customer?.name || "N/A"}
              </p>
              <p>
                <strong>Email:</strong> {selectedOrder.customer?.email || "N/A"}
              </p>
              <p>
                <strong>Total:</strong>{" "}
                {currency.format(selectedOrder.total ?? 0)}
              </p>
              <p>
                <strong>Status:</strong> {selectedOrder.status}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(selectedOrder.createdAt).toLocaleString()}
              </p>
              <hr className="my-4 border-blue-100" />
              <div>
                <strong>Products:</strong>
                <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                  {(selectedOrder.cartProducts || []).map((p, idx) => (
                    <li key={idx}>
                      {p.name} x {p.quantity} —{" "}
                      {currency.format(p.price * p.quantity)}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                disabled={sendingEmail}
                onClick={handleSendEmail}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm"
              >
                <Mail className="w-4 h-4" />{" "}
                {sendingEmail ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
