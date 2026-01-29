import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./ExpenseDashboard.css";

export default function ExpenseDashboard() {
  const [expenses, setExpenses] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ========================
     Helpers
  ======================== */
  // Plain formatting with normal commas
  const formatCurrency = (amount = 0) =>
    "₫ " + Number(amount).toLocaleString("en-US", { maximumFractionDigits: 0 });

  const calculateTotal = (costs = []) =>
    costs.reduce((sum, c) => sum + Number(c.amount || 0), 0);

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

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="expense-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Containers</th>
              <th>Cost Breakdown</th>
              <th>Total</th>
              <th>Remarks</th>
            </tr>
          </thead>

          <tbody>
            {filteredExpenses.map((e) => (
              <tr key={e._id}>
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
              </tr>
            ))}

            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan="5" className="empty">
                  No expenses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
