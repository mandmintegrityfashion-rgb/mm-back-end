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
    <div className="min-h-full bg-gradient-to-b from-white to-blue-50 p-6">
      {/* Header */}
      <div className="w-full border-b border-blue-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 tracking-tight">
            M&M Fashion — Promotions
          </h2>
          <button
            onClick={openModal}
            className="py-2 px-5 sm:px-6 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            + Add Promotion
          </button>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-3">
          <div className="w-full relative sm:w-2/3">
            <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search promotions..."
              className="w-full py-2.5 pl-10 pr-4 border border-blue-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleSearch}
            className="py-2 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-md rounded-lg bg-white">
        <table className="min-w-full border border-blue-100 text-sm text-gray-700">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-4 text-left">Product</th>
              <th className="p-4 text-left">Promo Price</th>
              <th className="p-4 text-left">Active</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {promotions.length > 0 ? (
              promotions.map((promo, index) => (
                <tr
                  key={promo._id}
                  className="hover:bg-blue-50 transition duration-150"
                >
                  <td className="p-4 font-semibold text-gray-800">
                    {promo.name}
                  </td>
                  <td className="p-4">
                    {editIndex === index ? (
                      <input
                        name="promoPrice"
                        value={editablePromotion.promoPrice || ""}
                        onChange={handleChange}
                        type="number"
                        className="w-32 border border-blue-300 p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    ) : (
                      `₦${promo.promoPrice || "-"}`
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-green-600 font-semibold">Active</span>
                  </td>
                  <td className="p-4 flex gap-2">
                    {editIndex === index ? (
                      <>
                        <button
                          onClick={() => handleUpdateClick(promo._id)}
                          className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelClick}
                          className="px-4 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditClick(index, promo)}
                          className="px-4 py-1 border border-blue-400 text-blue-700 rounded hover:bg-blue-600 hover:text-white transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(promo._id)}
                          className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-6 text-center text-gray-500">
                  No active promotions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-semibold text-blue-800 mb-4">
              Add New Promotion
            </h3>

            {/* Product List */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-gray-700">
                Select Product
              </label>
              <select
                className="border w-full p-2 rounded-md border-blue-200 focus:ring-1 focus:ring-blue-400"
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

            {/* Promo Price */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-gray-700">
                Promo Price
              </label>
              <input
                type="number"
                className="border w-full p-2 rounded-md border-blue-200 focus:ring-1 focus:ring-blue-400"
                value={promoPrice}
                onChange={(e) => setPromoPrice(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={closeModal}
                className="py-2 px-4 rounded-lg bg-gray-400 text-white hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePromotion}
                className="py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
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
