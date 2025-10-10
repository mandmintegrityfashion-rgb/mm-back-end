"use client";

import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import Layout from "@/components/Layout";
import axios from "axios";
import Link from "next/link";

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export default function Products() {
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [editIndex, setEditIndex] = useState(null);
  const [editableProduct, setEditableProduct] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [properties, setProperties] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 20;

  useEffect(() => {
    const fetchProducts = async () => {
      const res = await axios.get("/api/products");
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setAllProducts(data);
      setProducts(data);
    };

    const fetchCategories = async () => {
      const res = await axios.get("/api/categories");
      const map = (res.data || []).reduce((acc, c) => {
        acc[c._id] = c.name;
        return acc;
      }, {});
      setCategories(res.data || []);
      setCategoryMap(map);
    };

    fetchProducts();
    fetchCategories();
  }, []);

  const debouncedSearch = useCallback(
    debounce((term) => {
      const t = term.toLowerCase();
      const filtered = allProducts.filter(
        (p) =>
          p.name?.toLowerCase().includes(t) ||
          p.barcode?.toLowerCase().includes(t) ||
          p.description?.toLowerCase().includes(t) ||
          categoryMap[p.category]?.toLowerCase().includes(t)
      );
      setProducts(filtered);
      setCurrentPage(1);
    }, 300),
    [allProducts, categoryMap]
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleEditClick = (index, product) => {
    setEditIndex(index);
    setEditableProduct({ ...product });
    setProperties(product.properties || []);
  };

  const handleCancelClick = () => {
    setEditIndex(null);
    setEditableProduct({});
    setProperties([]);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditableProduct((prev) => {
      const newValue = type === "checkbox" ? checked : value;
      const updated = { ...prev, [name]: newValue };
      if (["costPrice", "margin", "taxRate"].includes(name)) {
        updated.salePriceIncTax = calculateSalePrice(
          parseFloat(updated.costPrice) || 0,
          parseFloat(updated.margin) || 0,
          parseFloat(updated.taxRate) || 0
        );
      }
      return updated;
    });
  };

  const handleCategoryChange = (value) =>
    setEditableProduct((prev) => ({ ...prev, category: value }));

  const handleUpdateClick = async (_id) => {
    try {
      const updatedProduct = { ...editableProduct, properties };
      await axios.put("/api/products", { ...updatedProduct, _id });

      setProducts((prev) =>
        prev.map((p) => (p._id === _id ? { ...p, ...updatedProduct } : p))
      );
      setAllProducts((prev) =>
        prev.map((p) => (p._id === _id ? { ...p, ...updatedProduct } : p))
      );
      setEditIndex(null);
    } catch (err) {
      alert("Failed to update product.");
    }
  };

  const handleDeleteClick = async (_id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    await axios.delete(`/api/products?id=${_id}`);
    setProducts((prev) => prev.filter((p) => p._id !== _id));
    setAllProducts((prev) => prev.filter((p) => p._id !== _id));
  };

  const addProperty = () =>
    setProperties((prev) => [...prev, { propName: "", propValue: "" }]);
  const removeProperty = (i) =>
    setProperties((prev) => prev.filter((_, idx) => idx !== i));
  const handlePropertyChange = (i, key, value) =>
    setProperties((prev) => {
      const updated = [...prev];
      updated[i][key] = value;
      return updated;
    });

  const calculateSalePrice = (cost, margin, tax) =>
    (cost * (1 + margin / 100) * (1 + tax / 100)).toFixed(2);

  const formatCurrency = (num) =>
    `₦${new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num || 0)}`;

  const totalPages = Math.ceil(products.length / entriesPerPage);
  const paginatedProducts = products.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  return (
    <Layout>
      <div className="p-6 bg-gradient-to-b from-white to-blue-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-blue-800">Products Page</h1>
          <Link href="../products/new">
            <button className="mt-2 sm:mt-0 py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-sm transition">
              + Add Product
            </button>
          </Link>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-blue-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full border border-blue-200 bg-white py-2 pl-9 pr-4 rounded-sm text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-sm shadow border border-blue-100 bg-white">
          <table className="min-w-full text-xs divide-y divide-blue-100">
            <thead className="bg-blue-600 text-white text-left">
              <tr>
                <th className="p-3"></th>
                <th className="p-3">Advanced</th>
                <th className="p-3">Name</th>
                <th className="p-3">Description</th>
                <th className="p-3">Cost</th>
                <th className="p-3">Tax %</th>
                <th className="p-3">Sale</th>
                <th className="p-3">Margin</th>
                <th className="p-3">Barcode</th>
                <th className="p-3">Properties</th>
                <th className="p-3">Category</th>
                <th className="p-3">Promo</th>
                <th className="p-3">Delete</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-blue-50">
              {paginatedProducts.map((p, idx) => (
                <tr
                  key={p._id}
                  className={`hover:bg-blue-50 transition cursor-pointer ${
                    expandedRow === idx ? "bg-blue-50" : ""
                  }`}
                  onClick={() =>
                    setExpandedRow(expandedRow === idx ? null : idx)
                  }
                >
                  <td className="p-2">
                    {editIndex === idx ? (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleUpdateClick(p._id)}
                          className="w-16 py-1 bg-green-600 text-white rounded text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelClick}
                          className="w-16 py-1 bg-gray-300 text-gray-700 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(idx, p);
                        }}
                        className="py-1 px-3 border border-blue-500 text-blue-700 hover:bg-blue-500 hover:text-white rounded text-xs"
                      >
                        Edit
                      </button>
                    )}
                  </td>

                  <td className="p-2">
                    <Link href={`/products/edit/${p._id}`}>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="py-1 px-3 border border-blue-400 text-blue-600 hover:bg-blue-600 hover:text-white rounded text-xs"
                      >
                        Advanced
                      </button>
                    </Link>
                  </td>

                  <td className="p-2 font-semibold">
                    {editIndex === idx ? (
                      <input
                        name="name"
                        value={editableProduct.name || ""}
                        onChange={handleChange}
                        className="w-36 border p-1 rounded text-xs"
                      />
                    ) : (
                      p.name
                    )}
                  </td>

                  <td className="p-2 max-w-[150px] truncate">
                    {expandedRow === idx ? p.description : p.description}
                  </td>

                  <td className="p-2">
                    {editIndex === idx ? (
                      <input
                        name="costPrice"
                        value={editableProduct.costPrice || ""}
                        onChange={handleChange}
                        type="number"
                        className="w-20 border p-1 rounded text-xs"
                      />
                    ) : (
                      formatCurrency(p.costPrice)
                    )}
                  </td>

                  <td className="p-2">
                    {editIndex === idx ? (
                      <input
                        name="taxRate"
                        value={editableProduct.taxRate || ""}
                        onChange={handleChange}
                        type="number"
                        className="w-16 border p-1 rounded text-xs"
                      />
                    ) : (
                      p.taxRate
                    )}
                  </td>

                  <td className="p-2 text-blue-800 font-semibold">
                    {editIndex === idx ? (
                      <input
                        name="salePriceIncTax"
                        value={editableProduct.salePriceIncTax || ""}
                        onChange={handleChange}
                        type="number"
                        className="w-20 border p-1 rounded text-xs"
                      />
                    ) : (
                      formatCurrency(p.salePriceIncTax)
                    )}
                  </td>

                  <td className="p-2">{p.margin}</td>
                  <td className="p-2">{p.barcode}</td>

                  <td className="p-2 text-gray-600">
                    {p.properties?.length > 0
                      ? p.properties
                          .map((pr) => `${pr.propName}: ${pr.propValue}`)
                          .join(", ")
                      : "—"}
                  </td>

                  <td className="p-2">{categoryMap[p.category] || "—"}</td>

                  <td className="p-2">
                    {p.isPromotion ? (
                      <span className="text-green-600 font-semibold">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>

                  <td className="p-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(p._id);
                      }}
                      className="py-1 px-3 bg-red-50 text-red-700 border border-red-300 hover:bg-red-600 hover:text-white rounded text-xs"
                    >
                      X
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center mt-6 flex-wrap gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-1 border border-blue-300 rounded text-sm disabled:opacity-40 hover:bg-blue-100"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`px-3 py-1 border rounded text-sm ${
                currentPage === num
                  ? "bg-blue-600 text-white border-blue-600"
                  : "hover:bg-blue-100 border-blue-200"
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-1 border border-blue-300 rounded text-sm disabled:opacity-40 hover:bg-blue-100"
          >
            Next
          </button>
        </div>
      </div>
    </Layout>
  );
}
