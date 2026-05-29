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
    Pending: "border border-blue-100 bg-blue-500/10 text-blue-700",
    Processing: "border border-amber-100 bg-amber-500/10 text-amber-700",
    Shipped: "border border-sky-100 bg-sky-500/10 text-sky-700",
    Delivered: "border border-emerald-100 bg-emerald-500/10 text-emerald-700",
    Cancelled: "border border-rose-100 bg-rose-500/10 text-rose-700",
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
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[90rem] space-y-6">
          <section className="shell-panel p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <span className="shell-pill">Order workflow</span>
                <h1 className="mt-5 text-[var(--mm-ink)]">Order inventory queue</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  Review new orders, move them through fulfillment, and trigger customer email updates from one control surface.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="shell-chip">Orders loaded: {orders.length}</span>
                <span className="shell-chip">Page {currentPage} of {totalPages}</span>
                <span className="shell-chip">
                  Awaiting action: {
                    orders.filter((order) => !["Delivered", "Cancelled"].includes(order.status)).length
                  }
                </span>
              </div>
            </div>

            <div className="mt-6 max-w-xl relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search by customer or order ID"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full !py-3 !pl-11 !pr-4 text-sm"
              />
            </div>
          </section>

          <section className="shell-panel overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-white/80 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mm-muted)]">
                  Fulfillment board
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--mm-ink)]">
                  Orders and status transitions
                </h2>
              </div>
              <p className="text-sm text-slate-500">
                Change status to open the email confirmation flow with delivery details when needed.
              </p>
            </div>

            <div className="overflow-x-auto px-3 pb-3 pt-1 sm:px-4">
              <table className="min-w-full text-sm sm:text-base border-collapse">
                <thead>
                  <tr>
                    {["Order ID", "Customer", "Total", "Status", "Date"].map((h) => (
                      <th
                        key={h}
                        className="bg-transparent px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm italic text-slate-400">
                        Loading orders...
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm italic text-slate-400">
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order._id} className="border-t border-white/70 transition hover:bg-blue-50/50">
                        <td className="px-4 py-4 align-top font-mono text-xs text-slate-500">
                          {order._id}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="font-semibold text-[var(--mm-navy)]">
                            {order.customer?.name || order.shippingDetails?.name || "N/A"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {order.customer?.email || order.shippingDetails?.email || "No email"}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top font-semibold text-[var(--mm-navy)]">
                          {currency.format(order.total ?? 0)}
                        </td>
                        <td className="px-4 py-4 align-top text-center">
                          <select
                            value={order.status}
                            disabled={updatingStatus || order.status === "Delivered"}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            className={clsx(
                              "min-w-[9.5rem] rounded-full px-4 py-2 text-xs font-semibold shadow-none transition",
                              statusClass[order.status] || "border border-slate-200 bg-slate-100 text-slate-600",
                              order.status === "Delivered" && "cursor-not-allowed opacity-60"
                            )}
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4 align-top text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString("en-NG")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/70 px-6 py-4">
              <p className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="shell-panel relative max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 lg:p-8">
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-rose-600"
              >
                <X className="h-4 w-4" />
              </button>

              <span className="shell-pill">
                {selectedOrder.nextStatus || selectedOrder.status} confirmation
              </span>
              <h3 className="mt-5 pr-12 text-2xl font-semibold text-[var(--mm-ink)]">
                {selectedOrder.nextStatus === "Shipped" || selectedOrder.nextStatus === "Delivered"
                  ? `${selectedOrder.nextStatus} confirmation details`
                  : `${selectedOrder.nextStatus} confirmation`}
              </h3>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Order</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <p><strong>Order ID:</strong> {selectedOrder._id}</p>
                    <p><strong>Customer:</strong> {selectedOrder.customer?.name}</p>
                    <p><strong>Email:</strong> {selectedOrder.customer?.email}</p>
                    <p><strong>Order Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/70 bg-[linear-gradient(135deg,var(--mm-navy),var(--mm-blue))] p-4 text-white shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100/80">Summary</p>
                  <p className="mt-3 text-3xl font-semibold">{currency.format(selectedOrder.total ?? 0)}</p>
                  <p className="mt-2 text-sm text-blue-100/80">Total order value for the selected transition.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Items</h4>
                  <ul className="mt-3 space-y-2">
                    {((selectedOrder.cartProducts && selectedOrder.cartProducts.length
                      ? selectedOrder.cartProducts
                      : selectedOrder.items) || []
                    ).map((item, i) => (
                      <li key={i} className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-sm">
                        {item.name.length > 25 ? item.name.slice(0, 25) + "..." : item.name} - {item.quantity} x ₦{item.price.toLocaleString()}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Delivery details</h4>
                  <p className="mt-3 leading-7 text-slate-600">
                    {selectedOrder.shippingDetails?.address || "No address"}
                    <br />
                    {selectedOrder.shippingDetails?.city || ""}
                    <br />
                    Phone: {selectedOrder.shippingDetails?.phone || "N/A"}
                  </p>
                </div>

                {(selectedOrder.nextStatus === "Shipped" || selectedOrder.nextStatus === "Delivered") && (
                  <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Delivery person</h4>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[var(--mm-navy)]">Delivery Person Name</label>
                        <input
                          type="text"
                          value={deliveryPersonName}
                          onChange={(e) => setDeliveryPersonName(e.target.value)}
                          placeholder="Enter delivery person's name"
                          className="w-full !py-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[var(--mm-navy)]">Delivery Person Phone</label>
                        <input
                          type="text"
                          value={deliveryPersonPhone}
                          onChange={(e) => setDeliveryPersonPhone(e.target.value)}
                          placeholder="Enter delivery person's phone"
                          className="w-full !py-3 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                disabled={sendingEmail}
                onClick={handleSendEmail}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--mm-navy),var(--mm-blue))] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(29,78,216,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
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
