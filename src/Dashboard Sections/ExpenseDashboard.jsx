import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./ExpenseDashboard.css";

export default function ExpenseDashboard() {
  const [expenses, setExpenses] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    invoiceNumber: "",
    expenseDate: "",
    remarks: "",
    costs: [],
  });

  /* ========================
     Helpers
  ======================== */
  // Plain formatting with normal commas
  const formatCurrency = (amount = 0) =>
    "₫ " + Number(amount).toLocaleString("en-US", { maximumFractionDigits: 0 });

  const calculateTotal = (costs = []) =>
    costs.reduce((sum, c) => sum + Number(c.amount || 0), 0);

  /* ========================
     Edit Handlers
  ======================== */
  const handleEditClick = (expense) => {
    setEditingId(expense._id);
    setEditForm({
      invoiceNumber: expense.invoiceNumber || "",
      expenseDate: expense.expenseDate ? expense.expenseDate.split("T")[0] : "",
      remarks: expense.remarks || "",
      costs: JSON.parse(JSON.stringify(expense.costs || [])),
    });
  };

  const handleCostChange = (index, field, value) => {
    const updatedCosts = [...editForm.costs];
    updatedCosts[index][field] = value;
    setEditForm({ ...editForm, costs: updatedCosts });
  };

  const handleSaveEdit = async () => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/expenses/${editingId}`,
        editForm
      );
      setExpenses((prev) =>
        prev.map((e) => (e._id === editingId ? response.data : e))
      );
      setEditingId(null);
      alert("Expense updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update expense");
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/expenses/${id}`);
      setExpenses((prev) => prev.filter((e) => e._id !== id));
      alert("Expense deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete expense");
    }
  };

  /* ======================== .0
     Load expenses
  ======================== */
  useEffect(() => {
    axios
      .get("https://vietnam-shipping-ms-backend-six.vercel.app/api/expenses/all")
      .then((res) => setExpenses(res.data))
      .catch(() => alert("Failed to load expenses"));
  }, []);

  /* ========================
     Filtered data
  ======================== */
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const expenseDate = new Date(e.expenseDate);

      if (fromDate && expenseDate < new Date(fromDate)) return false;
      if (toDate && expenseDate > new Date(toDate)) return false;

      return true;
    });
  }, [expenses, fromDate, toDate]);

  /* ========================
     Calculations
  ======================== */
  const totalExpenseAmount = filteredExpenses.reduce(
    (sum, e) => sum + calculateTotal(e.costs),
    0
  );

  const totalContainers = new Set(
    filteredExpenses.flatMap((e) => e.containerNumbers || [])
  ).size;

  const avgPerContainer =
    totalContainers > 0
      ? Math.round(totalExpenseAmount / totalContainers)
      : 0;

  /* ========================
     Render
  ======================== */
  return (
    <div className="expense-dashboard">
      <h2 className="page-title">Expense Dashboard</h2>
      <h1></h1>

      {/* SUMMARY CARDS */}
      <div className="summary-grid">
        <div className="summary-card">
          <span>Total Expense</span>
          <h3>{formatCurrency(totalExpenseAmount)}</h3>
        </div>

        <div className="summary-card">
          <span>Total Containers</span>
          <h3>{totalContainers}</h3>
        </div>

        <div className="summary-card">
          <span>Avg / Container</span>
          <h3>{formatCurrency(avgPerContainer)}</h3>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filter-row">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />

        <button
          onClick={() => {
            setFromDate("");
            setToDate("");
          }}
        >
          Reset
        </button>
      </div>

      {/* TABLE - EXPENSES BY INVOICE */}
      <div className="table-wrapper" style={{ marginTop: "20px" }}>
        <h3 style={{ marginBottom: "12px", paddingLeft: "4px" }}>📋 Expenses by Invoice</h3>
        <table className="expense-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Containers</th>
              <th>Cost Breakdown</th>
              <th>Total</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredExpenses.map((e) => (
              <tr key={e._id}>
                <td className="font-bold">{e.invoiceNumber || "Unknown"}</td>
                <td>{new Date(e.expenseDate).toLocaleDateString()}</td>

                {/* Containers */}
                <td>
                  <div className="container-badges">
                    {(e.containerNumbers || []).map((c) => (
                      <span key={c} className="badge">
                        {c}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Costs */}
                <td>
                  {e.costs.map((c, i) => (
                    <div key={i} className="cost-line">
                      <span>{c.costType}</span>
                      <span>{formatCurrency(c.amount)}</span>
                    </div>
                  ))}
                </td>

                {/* Total */}
                <td className="font-bold">{formatCurrency(calculateTotal(e.costs))}</td>

                <td>{e.remarks || "-"}</td>

                <td style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleEditClick(e)}
                    style={{
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(e._id)}
                    style={{
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan="7" className="empty">
                  No expenses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* INVOICE-WISE SUMMARY TABLE */}
      <div className="table-wrapper" style={{ marginTop: "32px" }}>
        <h3 style={{ marginBottom: "12px", paddingLeft: "4px" }}>📊 Invoice-wise Expense Summary</h3>
        <table className="expense-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Total Expenses (VND)</th>
              <th>Container Count</th>
              <th>Expense Count</th>
            </tr>
          </thead>

          <tbody>
            {/* Group expenses by invoice */}
            {Object.entries(
              filteredExpenses.reduce((acc, e) => {
                const inv = e.invoiceNumber || "Unknown";
                if (!acc[inv]) {
                  acc[inv] = {
                    totalExpense: 0,
                    containers: new Set(),
                    expenseCount: 0,
                  };
                }
                acc[inv].totalExpense += calculateTotal(e.costs);
                (e.containerNumbers || []).forEach((c) =>
                  acc[inv].containers.add(c)
                );
                acc[inv].expenseCount += 1;
                return acc;
              }, {})
            ).map(([invoice, data]) => (
              <tr key={invoice}>
                <td className="font-bold">{invoice}</td>
                <td className="text-red font-mono">
                  {formatCurrency(data.totalExpense)}
                </td>
                <td>{data.containers.size} Units</td>
                <td>{data.expenseCount}</td>
              </tr>
            ))}

            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan="4" className="empty">
                  No expenses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
    </div>

      {/* EDIT MODAL */}
      {editingId && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setEditingId(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "20px", fontWeight: "bold" }}>
              Edit Expense
            </h3>

            {/* Invoice Number */}
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "14px" }}>
                Invoice Number
              </label>
              <input
                type="text"
                value={editForm.invoiceNumber}
                onChange={(e) => setEditForm({ ...editForm, invoiceNumber: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Expense Date */}
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "14px" }}>
                Expense Date
              </label>
              <input
                type="date"
                value={editForm.expenseDate}
                onChange={(e) => setEditForm({ ...editForm, expenseDate: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Costs */}
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>
                Costs
              </label>
              {editForm.costs.map((cost, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "8px", marginBottom: "8px" }}>
                  <input
                    type="text"
                    placeholder="Cost Type"
                    value={cost.costType}
                    onChange={(e) => handleCostChange(i, "costType", e.target.value)}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={cost.amount}
                    onChange={(e) => handleCostChange(i, "amount", e.target.value)}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                    }}
                  />
                  <button
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        costs: editForm.costs.filter((_, idx) => idx !== i),
                      })
                    }
                    style={{
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}

              {/* Add Cost Button */}
              <button
                onClick={() =>
                  setEditForm({
                    ...editForm,
                    costs: [...editForm.costs, { costType: "", amount: 0 }],
                  })
                }
                style={{
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                  marginTop: "8px",
                }}
              >
                + Add Cost
              </button>
            </div>

            {/* Remarks */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: "500", fontSize: "14px" }}>
                Remarks
              </label>
              <textarea
                value={editForm.remarks}
                onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  boxSizing: "border-box",
                  minHeight: "80px",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setEditingId(null)}
                style={{
                  background: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
