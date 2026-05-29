// components/PromotionManagement.js
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Search } from "lucide-react";

export default function PromotionManagement() {
  const [promotions, setPromotions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editablePromotion, setEditablePromotion] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [promoPrice, setPromoPrice] = useState("");

  const fetchPromotions = async () => {
    try {
      const res = await axios.get("/api/products");
      const promoProducts = (
        Array.isArray(res.data) ? res.data : res.data?.data || []
      ).filter((p) => p.isPromotion === true);
      setPromotions(promoProducts);
    } catch (err) {
      console.error("Error fetching promotions:", err);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("/api/products");
      setAllProducts(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const handleSearch = () => {
    const filtered = promotions.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setPromotions(filtered);
  };

  const handleEditClick = (index, promo) => {
    setEditIndex(index);
    setEditablePromotion({ ...promo });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditablePromotion((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateClick = async (_id) => {
    try {
      await axios.put("/api/products", { ...editablePromotion, _id });
      setPromotions((prev) =>
        prev.map((p) => (p._id === _id ? { ...p, ...editablePromotion } : p))
      );
      setEditIndex(null);
    } catch (err) {
      console.error("Failed to update promotion:", err);
      alert("Error updating promotion!");
    }
  };

  const handleCancelClick = () => {
    setEditIndex(null);
    setEditablePromotion({});
  };

  const handleDeleteClick = async (_id) => {
    if (!window.confirm("Remove promotion from this product?")) return;
    try {
      await axios.put("/api/products", {
        _id,
        isPromotion: false,
        promoPrice: null,
      });
      setPromotions((prev) => prev.filter((p) => p._id !== _id));
    } catch (err) {
      console.error("Failed to remove promotion:", err);
    }
  };

  const openModal = () => {
    fetchProducts();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setPromoPrice("");
    setIsModalOpen(false);
  };

  const handleSavePromotion = async () => {
    if (!selectedProduct || !promoPrice) {
      alert("Please select a product and enter a promo price");
      return;
    }
    try {
      await axios.put("/api/products", {
        _id: selectedProduct._id,
        isPromotion: true,
        promoPrice: Number(promoPrice),
      });
      fetchPromotions();
      closeModal();
    } catch (err) {
      console.error("Error saving promotion:", err);
    }
  };

  return (
    <div className="space-y-6">
      <section className="shell-panel p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="shell-pill">Promotion desk</span>
            <h2 className="mt-5 text-[var(--mm-ink)]">Promotions</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Review active markdowns, adjust promo pricing inline, and launch a new promotional product without leaving setup.
            </p>
          </div>
          <button
            onClick={openModal}
            className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--mm-navy),var(--mm-blue))] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(29,78,216,0.22)]"
          >
            + Add Promotion
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="shell-chip">Active promos: {promotions.length}</span>
          <span className="shell-chip">Inline pricing enabled</span>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search promotions..."
              className="w-full !py-3 !pl-11 !pr-4 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleSearch}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[var(--mm-blue)] hover:bg-blue-50"
          >
            Search
          </button>
        </div>
      </section>

      <section className="shell-panel overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-white/80 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mm-muted)]">
              Promotion list
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--mm-ink)]">
              Live promotional products
            </h2>
          </div>
          <p className="text-sm text-slate-500">Edit promo price inline or remove a product from the campaign set.</p>
        </div>

        <div className="overflow-x-auto px-3 pb-3 pt-1 sm:px-4">
          <table className="min-w-full text-sm text-slate-700">
            <thead>
              <tr>
                <th className="bg-transparent p-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Product</th>
                <th className="bg-transparent p-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Promo Price</th>
                <th className="bg-transparent p-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Active</th>
                <th className="bg-transparent p-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.length > 0 ? (
                promotions.map((promo, index) => (
                  <tr
                    key={promo._id}
                    className="border-t border-white/70 transition hover:bg-blue-50/45"
                  >
                    <td className="p-4 font-semibold text-[var(--mm-navy)]">
                      {promo.name}
                    </td>
                    <td className="p-4">
                      {editIndex === index ? (
                        <input
                          name="promoPrice"
                          value={editablePromotion.promoPrice || ""}
                          onChange={handleChange}
                          type="number"
                          className="w-36 !py-2 text-sm"
                        />
                      ) : (
                        `₦${promo.promoPrice || "-"}`
                      )}
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Active
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {editIndex === index ? (
                          <>
                            <button
                              onClick={() => handleUpdateClick(promo._id)}
                              className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelClick}
                              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditClick(index, promo)}
                              className="rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-[var(--mm-blue)] hover:bg-blue-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(promo._id)}
                              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-600 hover:text-white"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-slate-500">
                    No active promotions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="shell-panel w-full max-w-lg p-6 lg:p-8">
            <span className="shell-pill">New promotion</span>
            <h3 className="mt-5 text-2xl font-semibold text-[var(--mm-ink)]">
              Add new promotion
            </h3>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--mm-navy)]">
                  Select Product
                </label>
                <select
                  className="w-full !py-3"
                  value={selectedProduct?._id || ""}
                  onChange={(e) => {
                    const prod = allProducts.find(
                      (p) => p._id === e.target.value
                    );
                    setSelectedProduct(prod);
                  }}
                >
                  <option value="">-- Choose Product --</option>
                  {allProducts.map((prod) => (
                    <option key={prod._id} value={prod._id}>
                      {prod.name} (₦{prod.salePriceIncTax})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--mm-navy)]">
                  Promo Price
                </label>
                <input
                  type="number"
                  className="w-full !py-3"
                  value={promoPrice}
                  onChange={(e) => setPromoPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={closeModal}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePromotion}
                className="rounded-full bg-[linear-gradient(135deg,var(--mm-navy),var(--mm-blue))] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(29,78,216,0.22)]"
              >
                Save Promotion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
