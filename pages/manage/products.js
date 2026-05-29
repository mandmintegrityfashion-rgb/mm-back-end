// pages/manage/products.js  (or your route file)
"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import Layout from "@/components/Layout";
import axios from "axios";
import Link from "next/link";
import useSWR, { mutate } from "swr";

const entriesPerPageDefault = 20;

// --- fetcher for SWR (uses axios so your existing endpoints stay the same)
const fetcher = (url) => axios.get(url).then((r) => r.data);

export default function Products() {
  // SWR-backed product list (cached & revalidated in background)
  const { data: productsData, error } = useSWR("/api/products", fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 60000,
  });

  // categories
  const { data: categoriesData } = useSWR("/api/categories", fetcher, {
    dedupingInterval: 60000,
  });

  // local UI state
  const [allProducts, setAllProducts] = useState([]); // full list (from SWR)
  const [filteredProducts, setFilteredProducts] = useState([]); // after search/filter
  const [categoryMap, setCategoryMap] = useState({});
  const [editIndex, setEditIndex] = useState(null);
  const [editableProduct, setEditableProduct] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [properties, setProperties] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);

  // pagination / lazy load
  const [entriesPerPage] = useState(entriesPerPageDefault);
  const [visibleCount, setVisibleCount] = useState(entriesPerPageDefault);

  // highlighted product id (persisted so when you go to edit page and back it stays)
  const [highlightedId, setHighlightedId] = useState(
    typeof window !== "undefined" ? sessionStorage.getItem("products:highlight") : null
  );

  // refs
  const searchRef = useRef();

  // Initialize from SWR when data arrives
  useEffect(() => {
    const list = Array.isArray(productsData) ? productsData : productsData?.data || [];
    setAllProducts(list);
    setFilteredProducts(list);
  }, [productsData]);

  // categories -> map
  useEffect(() => {
    const catList = Array.isArray(categoriesData) ? categoriesData : categoriesData?.data || [];
    const map = (catList || []).reduce((acc, c) => {
      acc[c._id] = c.name;
      return acc;
    }, {});
    setCategoryMap(map);
  }, [categoriesData]);

  // Keep highlightedId in sessionStorage so it's preserved when navigating away & back
  useEffect(() => {
    if (highlightedId) sessionStorage.setItem("products:highlight", highlightedId);
    else sessionStorage.removeItem("products:highlight");
  }, [highlightedId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const term = searchTerm.trim().toLowerCase();

      if (!term) {
        setFilteredProducts(allProducts);
        setVisibleCount(entriesPerPage);
        return;
      }

      const filtered = (Array.isArray(allProducts) ? allProducts : []).filter((product) =>
        [product.name, product.barcode, product.description, categoryMap[product.category]]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(term))
      );

      setFilteredProducts(filtered);
      setVisibleCount(entriesPerPage);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, allProducts, categoryMap, entriesPerPage]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Inline edit handlers
  const handleEditClick = (index, product) => {
    setEditIndex(index);
    setEditableProduct({ ...product });
    setProperties(product.properties || []);
    // set highlight now so when user leaves/returns it remains
    setHighlightedId(product._id);
  };

  const handleCancelClick = () => {
    setEditIndex(null);
    setEditableProduct({});
    setProperties([]);
    // keep highlight (helpful) — comment out to clear highlight on cancel
    // setHighlightedId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditableProduct((prev) => {
      const newValue = type === "checkbox" ? checked : value;
      const updated = { ...prev, [name]: newValue };
      if (["costPrice", "margin", "taxRate"].includes(name)) {
        const cost = parseFloat(updated.costPrice || 0);
        const margin = parseFloat(updated.margin || 0);
        const tax = parseFloat(updated.taxRate || 0);
        updated.salePriceIncTax = calculateSalePrice(cost, margin, tax);
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

      // update local cached arrays immediately (optimistic update)
      setFilteredProducts((prev) =>
        prev.map((p) => (p._id === _id ? { ...p, ...updatedProduct } : p))
      );
      setAllProducts((prev) => prev.map((p) => (p._id === _id ? { ...p, ...updatedProduct } : p)));

      // revalidate SWR cache for /api/products
      mutate("/api/products");

      // close edit mode & highlight the updated product
      setEditIndex(null);
      setHighlightedId(_id);
      // ensure the updated item is visible (if not in current page, expand visible area)
      const indexInFiltered = (filteredProducts || []).findIndex((p) => p._id === _id);
      if (indexInFiltered >= 0) {
        const pageNeeded = Math.floor(indexInFiltered / entriesPerPage) + 1;
        const neededVisible = pageNeeded * entriesPerPage;
        if (visibleCount < neededVisible) setVisibleCount(neededVisible);
      }
    } catch (err) {
      console.error("Failed to update product", err);
      alert("Failed to update product.");
    }
  };

  const handleDeleteClick = async (_id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`/api/products?id=${_id}`);
      setFilteredProducts((prev) => prev.filter((p) => p._id !== _id));
      setAllProducts((prev) => prev.filter((p) => p._id !== _id));
      mutate("/api/products");
      if (highlightedId === _id) setHighlightedId(null);
    } catch (err) {
      console.error("delete failed", err);
      alert("Delete failed.");
    }
  };

  // properties management helpers (kept from your original)
  const addProperty = () => setProperties((prev) => [...prev, { propName: "", propValue: "" }]);
  const removeProperty = (i) => setProperties((prev) => prev.filter((_, idx) => idx !== i));
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

  // Lazy loading (Load more) — visible slice
  const visibleProducts = Array.isArray(filteredProducts)
    ? filteredProducts.slice(0, visibleCount)
    : [];
  const visibleProductsCount = Math.min(
    visibleCount,
    filteredProducts?.length || 0
  );
  const promotionCount = allProducts.filter((product) => product.isPromotion)
    .length;
  const lowStockCount = allProducts.filter((product) => {
    const quantity = Number(product.quantity || 0);
    const minStock = Number(product.minStock || 0);
    return quantity <= (minStock > 0 ? minStock : 10);
  }).length;

  // load more helper
  const loadMore = () => {
    setVisibleCount((v) => Math.min((filteredProducts?.length || 0), v + entriesPerPage));
  };

  // If SWR returns error, show basic message
  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <h2 className="text-xl text-red-600">Failed to load products</h2>
          <p className="text-sm text-gray-600">{String(error)}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[90rem] space-y-6">
          <section className="shell-panel p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <span className="shell-pill">Catalog control</span>
                <h1 className="mt-5 text-[var(--mm-ink)]">Product inventory</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  Manage live stock, promotional pricing, and quick inline edits from the same inventory workspace.
                </p>
              </div>

              <Link
                href="../products/new"
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--mm-navy),var(--mm-blue))] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(29,78,216,0.24)]"
              >
                + Add Product
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="shell-chip">Products: {allProducts.length}</span>
              <span className="shell-chip">Promotions live: {promotionCount}</span>
              <span className="shell-chip">Low stock watch: {lowStockCount}</span>
            </div>

            <div className="mt-6 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search products, categories, or barcodes"
                  className="w-full !py-3 !pl-11 !pr-4 text-sm"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="flex items-center justify-center rounded-full border border-white/80 bg-white/88 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
                Showing {visibleProductsCount} of {filteredProducts.length} matching products
              </div>
            </div>
          </section>

          <section className="shell-panel overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-white/80 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mm-muted)]">
                  Inventory table
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--mm-ink)]">
                  Products in catalog
                </h2>
              </div>
              <p className="text-sm text-slate-500">
                Inline pricing edits stay available alongside the advanced product editor.
              </p>
            </div>

            <div className="overflow-x-auto px-3 pb-3 pt-1 sm:px-4">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="whitespace-nowrap bg-transparent px-3 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Quick
                    </th>
                    <th className="whitespace-nowrap bg-transparent px-3 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Advanced
                    </th>
                    <th className="whitespace-nowrap bg-transparent px-3 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Name
                    </th>
                    <th className="whitespace-nowrap bg-transparent px-3 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Description
                    </th>
                    <th className="whitespace-nowrap bg-transparent px-3 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Cost
                    </th>
                    <th className="whitespace-nowrap bg-transparent px-3 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Tax %
                    </th>
                    <th className="whitespace-nowrap bg-transparent px-3 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Sale
                    </th>
                    <th className="whitespace-nowrap bg-transparent px-3 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Margin
                    </th>
                    <th className="whitespace-nowrap bg-transparent px-3 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Barcode
                    </th>
                    <th className="whitespace-nowrap bg-transparent px-3 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Properties
                    </th>
                    <th className="whitespace-nowrap bg-transparent px-3 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Category
                    </th>
                    <th className="whitespace-nowrap bg-transparent px-3 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Promo
                    </th>
                    <th className="whitespace-nowrap bg-transparent px-3 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Delete
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleProducts.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-3 py-10 text-center text-sm italic text-slate-400">
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    visibleProducts.map((p, idx) => {
                      const realIndex = idx;
                      const isHighlighted = highlightedId && highlightedId === p._id;
                      return (
                        <tr
                          key={p._id}
                          className={`cursor-pointer border-t border-white/70 transition ${
                            expandedRow === realIndex ? "bg-blue-50/55" : "bg-transparent"
                          } ${isHighlighted ? "bg-blue-50/80 ring-1 ring-blue-100" : ""}`}
                          onClick={() =>
                            setExpandedRow(expandedRow === realIndex ? null : realIndex)
                          }
                        >
                          <td className="whitespace-nowrap px-3 py-4 align-top">
                            {editIndex === realIndex ? (
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateClick(p._id);
                                  }}
                                  className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelClick();
                                  }}
                                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(realIndex, p);
                                }}
                                className="rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-[var(--mm-blue)] hover:bg-blue-50"
                              >
                                Edit
                              </button>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 align-top">
                            <Link
                              href={`/products/edit/${p._id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                sessionStorage.setItem("products:highlight", p._id);
                              }}
                              className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-[var(--mm-navy)] hover:border-blue-200 hover:bg-blue-50"
                            >
                              Advanced
                            </Link>
                          </td>

                          <td className="px-3 py-4 align-top font-semibold text-[var(--mm-navy)]">
                            {editIndex === realIndex ? (
                              <input
                                name="name"
                                value={editableProduct.name || ""}
                                onChange={handleChange}
                                className="w-36 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-none"
                              />
                            ) : (
                              p.name
                            )}
                          </td>

                          <td className="max-w-[16rem] px-3 py-4 align-top text-slate-500">
                            <div className="line-clamp-2">{p.description}</div>
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 align-top text-slate-600">
                            {editIndex === realIndex ? (
                              <input
                                name="costPrice"
                                value={editableProduct.costPrice || ""}
                                onChange={handleChange}
                                type="number"
                                className="w-24 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-none"
                              />
                            ) : (
                              formatCurrency(p.costPrice)
                            )}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 align-top text-slate-600">
                            {editIndex === realIndex ? (
                              <input
                                name="taxRate"
                                value={editableProduct.taxRate || ""}
                                onChange={handleChange}
                                type="number"
                                className="w-20 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-none"
                              />
                            ) : (
                              p.taxRate
                            )}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 align-top font-semibold text-[var(--mm-navy)]">
                            {editIndex === realIndex ? (
                              <input
                                name="salePriceIncTax"
                                value={editableProduct.salePriceIncTax || ""}
                                onChange={handleChange}
                                type="number"
                                className="w-24 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-none"
                              />
                            ) : (
                              formatCurrency(p.salePriceIncTax)
                            )}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 align-top text-slate-600">
                            {p.margin}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 align-top font-mono text-xs text-slate-500">
                            {p.barcode || "-"}
                          </td>

                          <td className="max-w-[16rem] px-3 py-4 align-top text-slate-500">
                            {p.properties?.length > 0
                              ? p.properties
                                  .map((pr) => `${pr.propName}: ${pr.propValue}`)
                                  .join(", ")
                              : "No properties"}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 align-top text-slate-600">
                            {categoryMap[p.category] || "-"}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 align-top">
                            {p.isPromotion ? (
                              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Live
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-200/70 px-3 py-1 text-xs font-semibold text-slate-500">
                                Off
                              </span>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 align-top">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(p._id);
                              }}
                              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-600 hover:text-white"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-white/70 px-6 py-4">
              {visibleCount < (filteredProducts?.length || 0) ? (
                <button
                  onClick={loadMore}
                  className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--mm-navy)] hover:border-blue-200 hover:bg-blue-50"
                >
                  Load more
                </button>
              ) : (
                <div className="text-sm text-slate-500">End of catalog list</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
