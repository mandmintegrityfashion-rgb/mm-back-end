"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
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
  const [deliveryPersonName, setDeliveryPersonName] = useState("");
  const [deliveryPersonPhone, setDeliveryPersonPhone] = useState("");

  const entriesPerPage = 10;
  const statusOptions = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
  const currency = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  });

  const statusClass = {
    Pending: "bg-blue-100 text-blue-700",
    Processing: "bg-yellow-100 text-yellow-700",
    Shipped: "bg-sky-100 text-sky-700",
    Delivered: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
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

  const handleStatusChange = (orderId, newStatus) => {
    const order = orders.find((o) => o._id === orderId);
    setSelectedOrder({ ...order, nextStatus: newStatus });
    // Auto-fill delivery person info from previous Shipped data if switching to Delivered
    if (newStatus === "Delivered" && order.deliveryPerson) {
      if (order.deliveryPerson.name && !deliveryPersonName) setDeliveryPersonName(order.deliveryPerson.name);
      if (order.deliveryPerson.phone && !deliveryPersonPhone) setDeliveryPersonPhone(order.deliveryPerson.phone);
    }
  };

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
      console.error("Failed to update status:", error.response?.data || error);
      alert(`Failed to update status: ${error.response?.data?.error || "Unknown error"}`);
    }
    setUpdatingStatus(false);
  };

  const handleSendEmail = async () => {
    if (!selectedOrder?.customer?.email) return;

    const status = selectedOrder.nextStatus || selectedOrder.status;

    // Require delivery person info for Shipped or Delivered
    if ((status === "Shipped" || status === "Delivered") && (!deliveryPersonName || !deliveryPersonPhone)) {
      alert("Please enter delivery person's name and phone.");
      return;
    }

    setSendingEmail(true);

    const customerData = {
      name: selectedOrder.customer.name || "Customer",
      orderId: selectedOrder._id,
      status,
      total: selectedOrder.total,
      products: (selectedOrder.cartProducts || []).map((p) => ({
        name: p.name.length > 25 ? p.name.slice(0, 25) + "..." : p.name,
        quantity: p.quantity,
        price: p.price,
      })),
      shippingDetails: selectedOrder.shippingDetails || {},
      ...(status === "Shipped" || status === "Delivered" ? {
        deliveryPerson: { name: deliveryPersonName, phone: deliveryPersonPhone },
      } : {}),
    };

    try {
      await axios.post("/api/send-email", {
        to: selectedOrder.customer.email,
        status,
        customer: customerData,
      });

      // Update backend status after email is sent
      await updateStatus(selectedOrder._id, status);

      // Store delivery person info on the local order for auto-fill
      if (status === "Shipped" || status === "Delivered") {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === selectedOrder._id
              ? { ...order, status, deliveryPerson: { name: deliveryPersonName, phone: deliveryPersonPhone } }
              : order
          )
        );
      }

      alert(`${status} confirmation email sent successfully!`);
      setSelectedOrder(null);
      // Don't clear delivery person fields so they auto-fill for Delivered
      if (status === "Delivered") {
        setDeliveryPersonName("");
        setDeliveryPersonPhone("");
      }
    } catch (error) {
      console.error("Failed to send email:", error);
      alert(`Failed to send ${status} confirmation email.`);
    }

    setSendingEmail(false);
  };

  return (
    <Layout>
      <div className="p-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
        <div className="max-w-screen-xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-blue-800">M&M Fashion — Order Inventory</h1>

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

        <div className="overflow-x-auto rounded-lg border border-blue-100 shadow-sm">
          <table className="min-w-full text-sm sm:text-base border-collapse">
            <thead className="bg-blue-50 text-blue-800">
              <tr>
                {["Order ID", "Customer", "Total", "Status", "Date"].map((h) => (
                  <th key={h} className="text-left font-semibold py-3 px-4 border-b border-blue-100">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500 italic">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 italic text-gray-400">No orders found.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-blue-50 cursor-pointer transition">
                    <td className="font-mono text-blue-700 px-4 py-2">{order._id}</td>
                    <td className="px-4 py-2">{order.customer?.name || "N/A"}</td>
                    <td className="font-semibold text-gray-700 px-4 py-2">{currency.format(order.total ?? 0)}</td>
                    <td className="px-4 py-2 text-center">
                      <select
                        value={order.status}
                        disabled={updatingStatus || order.status === "Delivered"}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className={clsx(
                          "px-3 py-1 rounded-full text-xs font-semibold transition",
                          statusClass[order.status] || "bg-gray-100 text-gray-600",
                          order.status === "Delivered" && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">{new Date(order.createdAt).toLocaleDateString("en-NG")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>

        {/* Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full relative shadow-sm border border-blue-100 overflow-y-auto max-h-[90vh]">
              <button onClick={() => setSelectedOrder(null)} className="absolute top-3 right-3 text-gray-500 hover:text-red-500"><X /></button>
              <h3 className="text-2xl font-semibold text-blue-800 mb-4">
                {selectedOrder.nextStatus === "Shipped" || selectedOrder.nextStatus === "Delivered"
                  ? `${selectedOrder.nextStatus} Confirmation Details`
                  : `${selectedOrder.nextStatus} Confirmation`}
              </h3>

              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Order ID:</strong> {selectedOrder._id}</p>
                <p><strong>Customer:</strong> {selectedOrder.customer?.name}</p>
                <p><strong>Email:</strong> {selectedOrder.customer?.email}</p>
                <p><strong>Order Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>

                <h4 className="mt-4 font-semibold text-blue-700">Items:</h4>
                <ul className="list-disc list-inside text-sm">
                  {(selectedOrder.cartProducts || []).map((item, i) => (
                    <li key={i}>{item.name.length > 25 ? item.name.slice(0, 25) + "..." : item.name} — {item.quantity} × ₦{item.price.toLocaleString()}</li>
                  ))}
                </ul>

                <p className="mt-3 font-semibold text-gray-800">Total: {currency.format(selectedOrder.total ?? 0)}</p>

                <h4 className="mt-4 font-semibold text-blue-700">Delivery Details:</h4>
                <p>{selectedOrder.shippingDetails?.address || "No address"} <br />{selectedOrder.shippingDetails?.city || ""} <br />Phone: {selectedOrder.shippingDetails?.phone || "N/A"}</p>

                {(selectedOrder.nextStatus === "Shipped" || selectedOrder.nextStatus === "Delivered") && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Delivery Person Name</label>
                    <input
                      type="text"
                      value={deliveryPersonName}
                      onChange={(e) => setDeliveryPersonName(e.target.value)}
                      placeholder="Enter delivery person's name"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none mb-3"
                    />
                    <label className="block text-sm font-medium text-gray-600 mb-1">Delivery Person Phone</label>
                    <input
                      type="text"
                      value={deliveryPersonPhone}
                      onChange={(e) => setDeliveryPersonPhone(e.target.value)}
                      placeholder="Enter delivery person's phone"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  </div>
                )}
              </div>

              <button
                disabled={sendingEmail}
                onClick={handleSendEmail}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm"
              >
                {sendingEmail ? "Sending..." : `Send ${selectedOrder.nextStatus} Email`}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
