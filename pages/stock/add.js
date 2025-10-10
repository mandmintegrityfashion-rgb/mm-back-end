"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";

export default function StockMovementAdd() {
  const [locations, setLocations] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [reasons] = useState(["Restock", "Transfer", "Return"]);

  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [staff, setStaff] = useState("");
  const [reason, setReason] = useState("");

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantityInput, setQuantityInput] = useState(1);
  const [addedProducts, setAddedProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const router = useRouter();

  // Fetch store setup and staff list
  useEffect(() => {
    fetch("/api/setup/get")
      .then((res) => res.json())
      .then((data) => {
        if (data?.store?.locations) {
          const locs = data.store.locations.map((loc, i) => ({
            _id: i.toString(),
            name: loc,
          }));
          setLocations(locs);
        }
      });

    fetch("/api/staff")
      .then((res) => res.json())
      .then(setStaffList);
  }, []);

  // Product search with debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const trimmed = searchTerm.trim();
      if (trimmed.length >= 2) {
        setLoadingSearch(true);
        fetch(`/api/products?search=${encodeURIComponent(trimmed)}`)
          .then((res) => res.json())
          .then((data) => {
            // Handle both array or object response
            const productsArray = Array.isArray(data)
              ? data
              : data.products || [];
            setProducts(productsArray);
          })
          .catch(console.error)
          .finally(() => setLoadingSearch(false));
      } else {
        setProducts([]);
        setLoadingSearch(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Select a product from search
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setProducts([]);
  };

  // Add product to list
  const addProduct = () => {
    if (!selectedProduct) return;

    const existing = addedProducts.find((p) => p._id === selectedProduct._id);
    if (existing) {
      setAddedProducts((prev) =>
        prev.map((p) =>
          p._id === existing._id
            ? { ...p, quantity: p.quantity + quantityInput }
            : p
        )
      );
    } else {
      setAddedProducts((prev) => [
        ...prev,
        { ...selectedProduct, quantity: quantityInput },
      ]);
    }

    setSearchTerm("");
    setQuantityInput(1);
    setSelectedProduct(null);
  };

  // Remove product from list
  const removeProduct = (id) => {
    setAddedProducts((prev) => prev.filter((p) => p._id !== id));
  };

  // Save stock movement record
  const handleAddToStock = async () => {
    if (
      !fromLocation ||
      !toLocation ||
      !staff ||
      !reason ||
      addedProducts.length === 0
    ) {
      alert("Please complete all fields and add at least one product.");
      return;
    }

    try {
      const totalCostPrice = addedProducts.reduce(
        (sum, p) => sum + p.costPrice * p.quantity,
        0
      );

      const transRef = Date.now().toString();

      const payload = {
        transRef,
        fromLocation,
        toLocation,
        staff,
        reason,
        status: "Received",
        totalCostPrice,
        barcode: transRef,
        dateSent: new Date().toISOString(),
        dateReceived: new Date().toISOString(),
        products: addedProducts.map((p) => ({
          id: p._id,
          quantity: p.quantity,
        })),
      };

      const res = await fetch("/api/stock-movement/stock-movement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Stock update failed");

      router.push("/stock/movement");
    } catch (err) {
      console.error(err);
      alert("Error saving stock movement: " + err.message);
    }
  };

  const totalCost = addedProducts.reduce(
    (sum, p) => sum + p.costPrice * p.quantity,
    0
  );

  return (
    <Layout>
      <div className="p-8 bg-white min-h-screen">
        <div className="border-b pb-4 mb-6">
          <h1 className="text-3xl font-semibold text-blue-900">
            M&M Fashion — Stock Movement
          </h1>
          <p className="text-sm text-gray-500">
            Record stock transfers or restocks across your fashion outlets
          </p>
        </div>

        {/* Header Form */}
        <div className="grid md:grid-cols-2 gap-6 bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
          <Dropdown
            label="Deliver stock from"
            value={fromLocation}
            onChange={setFromLocation}
            options={[{ _id: "vendor", name: "Vendor" }, ...locations]}
          />
          <Dropdown
            label="Deliver stock to"
            value={toLocation}
            onChange={setToLocation}
            options={locations}
          />
          <Dropdown
            label="Staff member"
            value={staff}
            onChange={setStaff}
            options={staffList}
          />
          <Dropdown
            label="Reason"
            value={reason}
            onChange={setReason}
            options={reasons.map((r) => ({ name: r, _id: r }))}
          />
        </div>

        {/* Product Search */}
        <div className="bg-white mt-6 p-6 rounded-2xl border border-gray-100 shadow-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search product (by name or barcode)
          </label>
          <div className="relative">
            <input
              className="w-full border border-gray-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedProduct(null);
              }}
            />
            {loadingSearch && (
              <div className="absolute z-10 w-full bg-white border px-3 py-2 text-sm text-gray-400">
                Searching...
              </div>
            )}
            {!loadingSearch && products.length > 0 && (
              <ul className="absolute z-10 bg-white border w-full max-h-48 overflow-y-auto shadow-lg rounded-lg mt-1">
                {products.map((product) => (
                  <li
                    key={product._id}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-gray-700"
                    onClick={() => handleProductSelect(product)}
                  >
                    {product.name} — ₦{product.salePriceIncTax}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quantity Input */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setQuantityInput((q) => Math.max(q - 1, 1))}
              className="bg-blue-100 text-blue-800 font-bold w-8 h-8 rounded-full"
            >
              -
            </button>
            <input
              type="number"
              className="w-16 text-center border border-gray-200 rounded-lg"
              value={quantityInput}
              onChange={(e) =>
                setQuantityInput(parseInt(e.target.value) || 1)
              }
            />
            <button
              onClick={() => setQuantityInput((q) => q + 1)}
              className="bg-blue-100 text-blue-800 font-bold w-8 h-8 rounded-full"
            >
              +
            </button>
            <button
              onClick={addProduct}
              disabled={!selectedProduct}
              className="ml-auto bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              Add Item
            </button>
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-white mt-6 rounded-2xl border border-gray-100 shadow-sm overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-blue-100 text-blue-900 font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3">Unit Cost</th>
                <th className="px-4 py-3">Unit Sale</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Total Cost</th>
                <th className="px-4 py-3">Remove</th>
              </tr>
            </thead>
            <tbody>
              {addedProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 italic text-center text-gray-500"
                  >
                    Search and add items above to create a stock record
                  </td>
                </tr>
              ) : (
                addedProducts.map((p) => (
                  <tr
                    key={p._id}
                    className="border-t hover:bg-blue-50 transition"
                  >
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3">₦{p.costPrice}</td>
                    <td className="px-4 py-3">₦{p.salePriceIncTax}</td>
                    <td className="px-4 py-3">{p.quantity}</td>
                    <td className="px-4 py-3 font-semibold">
                      ₦{(p.quantity * p.costPrice).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => removeProduct(p._id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="text-right mt-6 font-semibold text-blue-900">
          Total Cost: ₦{totalCost.toLocaleString()}
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-8">
          <button className="bg-blue-100 text-blue-800 px-6 py-2 rounded-lg font-medium hover:bg-blue-200 transition">
            Stock Report
          </button>
          <button
            onClick={handleAddToStock}
            className="bg-blue-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-50"
            disabled={
              !fromLocation ||
              !toLocation ||
              !staff ||
              !reason ||
              addedProducts.length === 0
            }
          >
            Add to Stock
          </button>
        </div>
      </div>
    </Layout>
  );
}

// ✅ Fixed Dropdown (added `value` attributes)
function Dropdown({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <select
        className="w-full border border-gray-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">* Select {label}</option>
        {options.map((opt) => (
          <option key={opt._id} value={opt.name}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}
