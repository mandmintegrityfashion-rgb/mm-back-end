"use client";

import Layout from "@/components/Layout";
import Image from "next/image";
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
  const rootCategoryCount = categories.filter((cat) => !cat.parent).length;
  const propertySetCount = categories.reduce(
    (sum, cat) => sum + (cat.properties?.length || 0),
    0
  );

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[90rem] space-y-6">
          <section className="shell-panel p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <span className="shell-pill">Category system</span>
                <h1 className="mt-5 text-[var(--mm-ink)]">Categories and attributes</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  Structure the catalog hierarchy, upload visual identifiers, and keep reusable property sets organized for editing.
                </p>
              </div>

              <div className="w-full max-w-sm">
                <input
                  type="text"
                  placeholder="Search categories..."
                  className="w-full !py-3 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="shell-chip">Categories: {categories.length}</span>
              <span className="shell-chip">Root groups: {rootCategoryCount}</span>
              <span className="shell-chip">Property entries: {propertySetCount}</span>
            </div>
          </section>

          <section
            className={`shell-panel p-6 lg:p-8 ${
              editingId ? "ring-1 ring-blue-200" : ""
            }`}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col gap-3 border-b border-white/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mm-muted)]">
                    Category editor
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--mm-ink)]">
                    {editingId ? "Edit category" : "Add new category"}
                  </h2>
                </div>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--mm-navy)]">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full !py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--mm-navy)]">
                    Parent Category
                  </label>
                  <select
                    value={parentCategory}
                    onChange={(e) => setParentCategory(e.target.value)}
                    className="w-full !py-3"
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
                <label className="mb-3 block text-sm font-medium text-[var(--mm-navy)]">
                  Images
                </label>
                <div className="flex flex-wrap gap-3 items-center">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--mm-navy),var(--mm-blue))] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(29,78,216,0.22)]">
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
                      <Image
                        src={img.thumb || img.full}
                        width={64}
                        height={64}
                        unoptimized
                        className="h-16 w-16 rounded-2xl border border-white object-cover shadow-sm"
                        alt="Category"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs text-white opacity-0 transition group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Properties */}
              <div>
                <label className="mb-3 block text-sm font-medium text-[var(--mm-navy)]">
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
                      className="flex-1 !py-3 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Property Value"
                      value={prop.propValue}
                      onChange={(e) =>
                        handlePropertyChange(idx, "propValue", e.target.value)
                      }
                      className="flex-1 !py-3 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeProperty(idx)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-600 hover:text-white"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addProperty}
                  className="mt-2 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--mm-blue)] hover:bg-blue-50"
                >
                  + Add Property
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-full bg-[linear-gradient(135deg,var(--mm-navy),var(--mm-blue))] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(29,78,216,0.22)]"
                >
                  {editingId ? "Update Category" : "Save Category"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Table */}
          <section className="shell-panel overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-white/80 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mm-muted)]">
                  Category library
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--mm-ink)]">
                  All saved categories
                </h2>
              </div>
              <p className="text-sm text-slate-500">
                Search and edit hierarchy rules without leaving the screen.
              </p>
            </div>

            <div className="overflow-x-auto px-3 pb-3 pt-1 sm:px-4">
              <table className="min-w-full text-left text-sm">
                <thead>
                <tr>
                  <th className="bg-transparent p-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Name</th>
                  <th className="bg-transparent p-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Parent</th>
                  <th className="bg-transparent p-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Images</th>
                  <th className="bg-transparent p-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Properties</th>
                  <th className="bg-transparent p-3 text-center text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr
                    key={cat._id}
                    className={`border-t border-white/70 transition ${
                      editingId === cat._id ? "bg-blue-50/70 ring-1 ring-blue-100" : "hover:bg-blue-50/45"
                    }`}
                  >
                    <td className="p-3 font-medium text-[var(--mm-navy)]">{cat.name}</td>
                    <td className="p-3 text-slate-500">{cat.parent?.name || "-"}</td>
                    <td className="p-3">
                      <div className="flex gap-1.5">
                        {cat.images?.map((img, j) => (
                          <Image
                            key={j}
                            src={img.thumb || img.full}
                            width={40}
                            height={40}
                            unoptimized
                            className="h-10 w-10 rounded-xl border border-white object-cover shadow-sm"
                            alt={cat.name}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(cat.properties || []).map((p, k) => (
                          <span
                            key={k}
                            className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
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
                          className="rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-[var(--mm-blue)] hover:bg-blue-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat._id)}
                          className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-600 hover:text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-10 text-center italic text-slate-400">
                      No categories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
