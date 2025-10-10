"use client";

import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faEdit,
  faSave,
  faTimes,
  faPlus,
  faImages,
} from "@fortawesome/free-solid-svg-icons";
import Loader from "@/components/Loader";

export default function Categories() {
  const [name, setName] = useState("");
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parentCategory, setParentCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editedCategory, setEditedCategory] = useState({
    name: "",
    parentCategory: "",
    images: [],
    properties: [],
  });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/categories");
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch categories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // --- Image Upload ---
  const uploadImage = async (ev, isEdit = false) => {
    const files = ev.target.files;
    if (!files?.length) return;

    const previews = Array.from(files).map((f) => ({
      full: URL.createObjectURL(f),
      thumb: URL.createObjectURL(f),
      isTemp: true,
    }));

    if (isEdit) {
      setEditedCategory((prev) => ({
        ...prev,
        images: previews,
      }));
    } else {
      setImages(previews);
    }

    const formData = new FormData();
    for (const f of files) formData.append("file", f);

    setLoading(true);
    try {
      const res = await axios.post("/api/upload", formData);
      const uploaded = res.data?.links || [];
      const formatted = uploaded.map((link) => ({
        full: link.full || link,
        thumb: link.thumb || link,
        isTemp: false,
      }));

      if (isEdit) {
        setEditedCategory((prev) => ({ ...prev, images: formatted }));
      } else {
        setImages(formatted);
      }
    } catch (err) {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index, isEdit = false) => {
    if (isEdit) {
      setEditedCategory((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    } else {
      setImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const addProperty = (isEdit = false) => {
    const prop = { propName: "", propValue: "" };
    if (isEdit)
      setEditedCategory((prev) => ({
        ...prev,
        properties: [...prev.properties, prop],
      }));
    else setProperties((prev) => [...prev, prop]);
  };

  const handlePropertyChange = (index, key, value, isEdit = false) => {
    if (isEdit) {
      setEditedCategory((prev) => {
        const updated = [...prev.properties];
        updated[index][key] = value;
        return { ...prev, properties: updated };
      });
    }
  };

  const removeProperty = (index, isEdit = false) => {
    if (isEdit)
      setEditedCategory((prev) => ({
        ...prev,
        properties: prev.properties.filter((_, i) => i !== index),
      }));
  };

  // --- Save New Category ---
  const saveCategory = async (ev) => {
    ev.preventDefault();
    if (!name.trim() || !images.length)
      return alert("Name and at least one image required");

    const formattedImages = images.map((img) => ({
      full: img.full,
      thumb: img.thumb,
    }));

    try {
      const res = await axios.post("/api/categories", {
        name,
        parentCategory: parentCategory || null,
        images: formattedImages,
        properties,
      });
      setCategories((prev) => [...prev, res.data]);
      setName("");
      setParentCategory("");
      setImages([]);
      setProperties([]);
    } catch {
      alert("Failed to save category");
    }
  };

  // --- Edit & Update ---
  const handleEditClick = (index, category) => {
    setEditIndex(index);
    setEditedCategory({
      _id: category._id,
      name: category.name || "",
      parentCategory: category.parent?._id || "",
      images: category.images || [],
      properties: category.properties || [],
    });
  };

  const handleUpdateClick = async (id) => {
    if (!editedCategory.name.trim() || !editedCategory.images?.length)
      return alert("Name and images required");

    const formattedImages = editedCategory.images.map((img) => ({
      full: img.full,
      thumb: img.thumb,
    }));

    try {
      const res = await axios.put("/api/categories", {
        _id: id,
        ...editedCategory,
        images: formattedImages,
      });
      setCategories((prev) =>
        prev.map((cat) => (cat._id === id ? res.data : cat))
      );
      handleCancelClick();
    } catch {
      alert("Update failed");
    }
  };

  const handleCancelClick = () => {
    setEditIndex(null);
    setEditedCategory({ name: "", parentCategory: "", images: [], properties: [] });
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await axios.delete("/api/categories?id=" + id);
      setCategories((prev) => prev.filter((cat) => cat._id !== id));
    } catch {
      alert("Delete failed");
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="px-6 py-8 bg-gradient-to-b from-blue-50 to-white min-h-screen">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <h1 className="text-3xl font-bold text-blue-700">
            Categories
            </h1>
            <input
              type="text"
              placeholder="Search categories..."
              className="border border-blue-200 rounded-lg px-4 py-2 w-full sm:w-64 mt-4 sm:mt-0 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Add Category Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
            <form onSubmit={saveCategory} className="space-y-6">
              <div className="flex items-center gap-2 border-b pb-3">
                <FontAwesomeIcon icon={faPlus} className="text-blue-500" />
                <h2 className="text-lg font-semibold text-blue-700">
                  Add New Category
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-blue-700 font-medium mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter category name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm text-blue-700 font-medium mb-1">
                    Parent Category
                  </label>
                  <select
                    value={parentCategory}
                    onChange={(e) => setParentCategory(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-blue-400 focus:border-blue-400"
                  >
                    <option value="">No Parent</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm text-blue-700 font-medium mb-2">
                  Images
                </label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition">
                    <FontAwesomeIcon icon={faImages} />
                    Upload
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={uploadImage}
                    />
                  </label>
                  {loading && <Loader />}
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={img.thumb || img.full}
                        alt="category"
                        className="w-16 h-16 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i, false)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:opacity-90 transition"
              >
                Save Category
              </button>
            </form>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-4 overflow-x-auto">
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
                {filteredCategories.map((cat, index) => (
                  <tr
                    key={cat._id}
                    className="border-b hover:bg-blue-50 transition"
                  >
                    <td className="p-3">{cat.name}</td>
                    <td className="p-3">{cat.parent?.name || "-"}</td>
                    <td className="p-3 flex gap-2">
                      {cat.images.map((img, i) => (
                        <img
                          key={i}
                          src={img.thumb || img.full}
                          className="w-10 h-10 object-cover rounded-md border"
                        />
                      ))}
                    </td>
                    <td className="p-3">
                      {(cat.properties || []).map((p, i) => (
                        <span
                          key={i}
                          className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md border border-blue-100 mr-2"
                        >
                          {p.propName}: {p.propValue}
                        </span>
                      ))}
                    </td>
                    <td className="p-3 text-center flex justify-center gap-3">
                      <button
                        onClick={() => handleEditClick(index, cat)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-gray-400">
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
