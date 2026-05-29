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

  const managerCount = staffList.filter((staff) => staff.role === "manager").length;
  const staffCount = staffList.filter((staff) => staff.role === "staff").length;

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[90rem] space-y-6">
          <section className="shell-panel p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <span className="shell-pill">Team access</span>
                <h1 className="mt-5 text-[var(--mm-ink)]">Staff accounts</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  Create and maintain staff credentials from a cleaner admin surface with faster role visibility.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="shell-chip">Total team: {staffList.length}</span>
                <span className="shell-chip">Managers: {managerCount}</span>
                <span className="shell-chip">Staff: {staffCount}</span>
              </div>
            </div>
          </section>

          <section className="shell-panel p-6 lg:p-8">
            <div className="mb-5 flex flex-col gap-2 border-b border-white/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mm-muted)]">
                  New account
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--mm-ink)]">
                  Add new staff member
                </h2>
              </div>
              <p className="text-sm text-slate-500">Passwords are stored securely after submission.</p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-4 md:grid-cols-4"
            >
              <input
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                className="!py-3"
              />
              <input
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                className="!py-3"
              />
              <input
                name="password"
                placeholder="Password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className="!py-3"
              />
              <button
                type="submit"
                className="rounded-full bg-[linear-gradient(135deg,var(--mm-navy),var(--mm-blue))] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(29,78,216,0.22)]"
              >
                Add Staff
              </button>
            </form>
          </section>

          <section className="shell-panel overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-white/80 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--mm-muted)]">
                  Team roster
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--mm-ink)]">
                  Existing staff accounts
                </h2>
              </div>
              <p className="text-sm text-slate-500">Edit names, usernames, and roles inline.</p>
            </div>

            <div className="overflow-x-auto px-3 pb-3 pt-1 sm:px-4">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-[var(--mm-blue)] animate-spin"></div>
            </div>
          ) : staffList.length === 0 ? (
            <p className="py-10 text-center text-slate-500">
              No staff members found.
            </p>
          ) : (
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="bg-transparent px-4 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Name</th>
                  <th className="bg-transparent px-4 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Username</th>
                  <th className="bg-transparent px-4 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Role</th>
                  <th className="bg-transparent px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff, index) => (
                  <tr
                    key={staff._id}
                    className={`${index % 2 === 0 ? "bg-transparent" : "bg-blue-50/25"} border-t border-white/70 hover:bg-blue-50/45`}
                  >
                    <td className="py-3 px-4">
                      {editingId === staff._id ? (
                        <input
                          name="name"
                          value={editData.name}
                          onChange={handleEditChange}
                          className="w-full !py-2 text-sm"
                        />
                      ) : (
                        <span className="font-medium text-[var(--mm-navy)]">
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
                          className="w-full !py-2 text-sm"
                        />
                      ) : (
                        <span className="text-slate-600">{staff.username}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingId === staff._id ? (
                        <select
                          name="role"
                          value={editData.role}
                          onChange={handleEditChange}
                          className="w-full !py-2 text-sm"
                        >
                          <option value="staff">Staff</option>
                          <option value="manager">Manager</option>
                        </select>
                      ) : (
                        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                          {staff.role}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {editingId === staff._id ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => saveEdit(staff._id)}
                            className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(staff)}
                          className="rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-[var(--mm-blue)] hover:bg-blue-50"
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
          </section>
        </div>
      </div>
    </Layout>
  );
}
