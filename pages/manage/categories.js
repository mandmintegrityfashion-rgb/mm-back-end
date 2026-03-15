"use client";

import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import axios from "axios";
import Loader from "@/components/Loader";
import compressImage from "@/lib/compressImage";

export default function Categories() {
  const [name, setName] = useState("");
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parentCategory, setParentCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/api/categories");
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch categories");
      }
    })();
  }, []);

  // Image upload with client-side compression
  const uploadImages = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    setLoading(true);

    const previews = Array.from(files).map((file) => ({
      full: URL.createObjectURL(file),
      thumb: URL.createObjectURL(file),
      isTemp: true,
    }));
    setImages((prev) => [...prev, ...previews]);

    try {
      const compressed = await Promise.all(
        Array.from(files).map((f) => compressImage(f))
      );
      const formData = new FormData();
      for (const f of compressed) formData.append("file", f);

      const res = await axios.post("/api/upload", formData);
      const uploaded = res.data?.links || [];
      setImages((prev) => [
        ...prev.filter((img) => !img.isTemp),
        ...uploaded,
      ]);
    } catch (err) {
      console.error("Image upload failed:", err);
      setImages((prev) => prev.filter((img) => !img.isTemp));
      const msg =
        err.response?.status === 413
          ? "Image is too large. Please use a smaller image."
          : "Image upload failed. Please try again.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addProperty = () => {
    setProperties((prev) => [...prev, { propName: "", propValue: "" }]);
  };

  const handlePropertyChange = (index, key, value) => {
    setProperties((prev) => {
      const updated = [...prev];
      updated[index][key] = value;
      return updated;
    });
  };

  const removeProperty = (index) => {
    setProperties((prev) => prev.filter((_, i) => i !== index));
  };

  // Populate form for editing
  const handleEditClick = (cat) => {
    setEditingId(cat._id);
    setName(cat.name);
    setParentCategory(cat.parent?._id || "");
    setImages(cat.images || []);
    setProperties(cat.properties || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setParentCategory("");
    setImages([]);
    setProperties([]);
  };

  // Save (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Category name is required");
    if (!images.length) return alert("Please upload at least one image");

    const formattedImages = images.map((img) => ({
      full: img.full,
      thumb: img.thumb,
    }));

    try {
      if (editingId) {
        const res = await axios.put("/api/categories", {
          _id: editingId,
          name,
          parentCategory: parentCategory || null,
          images: formattedImages,
          properties,
        });
        setCategories((prev) =>
          prev.map((cat) => (cat._id === editingId ? res.data : cat))
        );
      } else {
        const res = await axios.post("/api/categories", {
          name,
          parentCategory: parentCategory || null,
          images: formattedImages,
          properties,
        });
        setCategories((prev) => [...prev, res.data]);
      }
      cancelEdit();
    } catch (err) {
      console.error(err);
      alert(editingId ? "Failed to update category" : "Failed to save category");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await axios.delete("/api/categories?id=" + id);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      if (editingId === id) cancelEdit();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
        <div className="max-w-screen-xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <h1 className="text-3xl font-bold text-blue-800">
              M&M Fashion — Categories
            </h1>
            <input
              type="text"
              placeholder="Search categories..."
              className="border border-blue-200 rounded-lg px-4 py-2 w-full sm:w-64 mt-4 sm:mt-0 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Add / Edit Category — Single Form */}
          <div className={`bg-white p-6 rounded-xl shadow-sm border ${editingId ? "border-blue-300 ring-2 ring-blue-100" : "border-blue-100"}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-lg font-semibold text-blue-700">
                  {editingId ? "Edit Category" : "Add New Category"}
                </h2>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-sm text-gray-500 hover:text-red-500 transition"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Parent Category
                  </label>
                  <select
                    value={parentCategory}
                    onChange={(e) => setParentCategory(e.target.value)}
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                  >
                    <option value="">No Parent</option>
                    {categories
                      .filter((c) => c._id !== editingId)
                      .map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  Images
                </label>
                <div className="flex flex-wrap gap-3 items-center">
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition text-sm">
                    + Upload Images
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={uploadImages}
                    />
                  </label>
                  {loading && <Loader />}
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={img.thumb || img.full}
                        className="w-16 h-16 object-cover rounded-lg border border-blue-100"
                        alt=""
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Properties */}
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  Properties
                </label>
                {properties.map((prop, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Property Name"
                      value={prop.propName}
                      onChange={(e) =>
                        handlePropertyChange(idx, "propName", e.target.value)
                      }
                      className="flex-1 border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Property Value"
                      value={prop.propValue}
                      onChange={(e) =>
                        handlePropertyChange(idx, "propValue", e.target.value)
                      }
                      className="flex-1 border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeProperty(idx)}
                      className="text-red-500 hover:text-red-700 text-sm px-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addProperty}
                  className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                >
                  + Add Property
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  {editingId ? "Update Category" : "Save Category"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-blue-50 text-blue-700 font-medium">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Parent</th>
                  <th className="p-3">Images</th>
                  <th className="p-3">Properties</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr
                    key={cat._id}
                    className={`border-b hover:bg-blue-50/50 transition ${
                      editingId === cat._id ? "bg-blue-50 ring-1 ring-blue-200" : ""
                    }`}
                  >
                    <td className="p-3 font-medium text-gray-800">{cat.name}</td>
                    <td className="p-3 text-gray-600">{cat.parent?.name || "—"}</td>
                    <td className="p-3">
                      <div className="flex gap-1.5">
                        {cat.images?.map((img, j) => (
                          <img
                            key={j}
                            src={img.thumb || img.full}
                            className="w-10 h-10 object-cover rounded-md border border-blue-100"
                            alt=""
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(cat.properties || []).map((p, k) => (
                          <span
                            key={k}
                            className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded border border-blue-100"
                          >
                            {p.propName}: {p.propValue}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(cat)}
                          className="text-xs px-3 py-1 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-600 hover:text-white transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat._id)}
                          className="text-xs px-3 py-1 border border-red-300 text-red-600 rounded-md hover:bg-red-600 hover:text-white transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-gray-400 italic">
                      No categories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
