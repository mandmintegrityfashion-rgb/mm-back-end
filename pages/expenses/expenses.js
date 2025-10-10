import { useState, useEffect } from "react";
import { CalendarDays, CircleDollarSign } from "lucide-react";
import Layout from "@/components/Layout";
import ExpenseForm from "@/components/ExpenseForm";
import axios from "axios";

export default function ManageExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredExpenses, setFilteredExpenses] = useState([]);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get("/api/expenses");
      const data = Array.isArray(res.data) ? res.data : [];
      setExpenses(data);
      setFilteredExpenses(data);
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
      setExpenses([]);
      setFilteredExpenses([]);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSearch = () => {
    const term = searchTerm.toLowerCase();
    const filtered = expenses.filter(
      (exp) =>
        exp.title?.toLowerCase().includes(term) ||
        exp.description?.toLowerCase().includes(term) ||
        exp.category?.name?.toLowerCase().includes(term) ||
        exp.amount?.toString().includes(term)
    );
    setFilteredExpenses(filtered);
  };

  const handleDelete = async (_id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await axios.delete(`/api/expenses?id=${_id}`);
      setExpenses((prev) => prev.filter((e) => e._id !== _id));
      setFilteredExpenses((prev) => prev.filter((e) => e._id !== _id));
    } catch (err) {
      console.error("Failed to delete expense:", err);
      alert("Failed to delete expense. Please try again.");
    }
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return "";
    return new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  return (
    <Layout>
      <div className="min-h-screen p-6 bg-gray-100">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-3xl font-bold text-blue-800 mb-6">Expense Management</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left Panel: Add Expense */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
              <h2 className="text-xl font-semibold text-blue-700 mb-4">Add New Expense</h2>
              <ExpenseForm
                onSaved={fetchExpenses}
                categoryApi="/api/expense-category/expense-category"
              />
            </div>

            {/* Right Panel: Parent Card for Expenses */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col gap-4">
                {/* Search */}
                <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 px-4 py-2 rounded-lg w-full sm:w-1/3"
                  />
                  <button
                    onClick={handleSearch}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Search
                  </button>
                </div>

                {/* Expenses List */}
                <div className="flex flex-col gap-4 max-h-[700px] overflow-y-auto">
                  {filteredExpenses.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">
                      <CircleDollarSign className="w-10 h-10 mx-auto mb-3" />
                      <p>No expenses recorded.</p>
                    </div>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <div
                        key={exp._id}
                        className="border border-gray-100 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition"
                      >
                        <div>
                          <h3 className="font-medium text-gray-900 flex items-center gap-2">
                            <CircleDollarSign className="w-4 h-4 text-green-500" />
                            {exp.title}
                          </h3>
                          <div className="text-xs text-gray-500 flex gap-2 items-center mt-1">
                            <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full uppercase">
                              {exp.category?.name || "Uncategorized"}
                            </span>
                            <CalendarDays className="w-3 h-3" />
                            {new Date(exp.createdAt).toLocaleDateString("en-NG", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          {exp.description && (
                            <p className="text-sm text-gray-600 mt-1 truncate">{exp.description}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="font-bold text-green-600">
                            ₦{formatNumber(exp.amount)}
                          </span>
                          <button
                            onClick={() => handleDelete(exp._id)}
                            className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
