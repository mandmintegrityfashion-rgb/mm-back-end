"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "@/components/Layout";

export default function StaffPage() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "staff",
  });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/staff");
      setStaffList(res.data);
    } catch (err) {
      console.error("API Error:", err.response?.data || err.message);
      alert("Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password) return;
    try {
      await axios.post("/api/staff", formData);
      setFormData({ name: "", username: "", password: "", role: "staff" });
      fetchStaff();
    } catch (err) {
      alert("Failed to create staff: " + (err.response?.data?.error || err.message));
    }
  };

  const startEditing = (staff) => {
    setEditingId(staff._id);
    setEditData({
      name: staff.name,
      username: staff.username,
      role: staff.role,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const saveEdit = async (id) => {
    try {
      await axios.put(`/api/staff/${id}`, editData);
      setEditingId(null);
      setEditData({});
      fetchStaff();
    } catch (err) {
      alert("Failed to update staff: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <Layout>
      <div className="p-8 w-full mx-auto bg-gray-50 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <h1 className="text-3xl font-bold text-blue-800">M&M Fashion Staff</h1>
          <p className="text-gray-500 mt-2 sm:mt-0">
            Manage all your staff accounts easily ✨
          </p>
        </div>

        {/* Add Staff Section */}
        <div className="bg-white shadow-md rounded-xl p-6 mb-10 border border-blue-100">
          <h2 className="text-lg font-semibold text-blue-700 mb-4">
            Add New Staff Member
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <input
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleInputChange}
              className="border border-blue-200 focus:border-blue-500 px-3 py-2 rounded-md outline-none focus:ring-2 focus:ring-blue-200 transition"
            />
            <input
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleInputChange}
              className="border border-blue-200 focus:border-blue-500 px-3 py-2 rounded-md outline-none focus:ring-2 focus:ring-blue-200 transition"
            />
            <input
              name="password"
              placeholder="Password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className="border border-blue-200 focus:border-blue-500 px-3 py-2 rounded-md outline-none focus:ring-2 focus:ring-blue-200 transition"
            />
            <button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-md transition"
            >
              Add Staff
            </button>
          </form>
        </div>

        {/* Staff List Section */}
        <div className="overflow-x-auto bg-white shadow-md rounded-xl border border-blue-100">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : staffList.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No staff members found.
            </p>
          ) : (
            <table className="min-w-full text-sm text-left">
              <thead className="bg-blue-50 text-blue-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff, index) => (
                  <tr
                    key={staff._id}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-blue-50"
                    } border-t border-blue-100 hover:bg-blue-100/40`}
                  >
                    <td className="py-3 px-4">
                      {editingId === staff._id ? (
                        <input
                          name="name"
                          value={editData.name}
                          onChange={handleEditChange}
                          className="border border-blue-200 px-2 py-1 rounded-md w-full"
                        />
                      ) : (
                        <span className="font-medium text-gray-800">
                          {staff.name}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingId === staff._id ? (
                        <input
                          name="username"
                          value={editData.username}
                          onChange={handleEditChange}
                          className="border border-blue-200 px-2 py-1 rounded-md w-full"
                        />
                      ) : (
                        <span className="text-gray-700">{staff.username}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingId === staff._id ? (
                        <select
                          name="role"
                          value={editData.role}
                          onChange={handleEditChange}
                          className="border border-blue-200 px-2 py-1 rounded-md w-full"
                        >
                          <option value="staff">Staff</option>
                          <option value="manager">Manager</option>
                        </select>
                      ) : (
                        <span className="capitalize text-blue-700 font-medium">
                          {staff.role}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {editingId === staff._id ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => saveEdit(staff._id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded-md"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(staff)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
