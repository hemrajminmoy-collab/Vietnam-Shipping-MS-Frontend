import { useState } from "react";
import axios from "axios";
import "./ExpenseForm.css";

const COST_TYPES = [
  "Local charges",
  "Extension delivery order charges",
  "Port Infrastructure fee",
  "E Port Charges",
  "Extension port storage",
  "Custom clearance",
  "Clearing agent fees",
  "Extension (Dem + Det)",
  "Lift Off Charges",
  "Container deposit",
  "Trucking fee",
  "Return empty depo fee",
  "Others",
];

export default function ExpenseForm({
  selectedContainerNumbers = [],
  onSuccess,
}) {
  const [form, setForm] = useState({
    expenseDate: "",
    remarks: "",
    costs: [{ costType: "", amount: "" }],
  });

  const [submitting, setSubmitting] = useState(false);

  // 🔹 Handle cost row change
  const handleCostChange = (index, field, value) => {
    const updatedCosts = [...form.costs];
    updatedCosts[index][field] = value;
    setForm({ ...form, costs: updatedCosts });
  };

  // 🔹 Add new cost row
  const addCostRow = () => {
    setForm({
      ...form,
      costs: [...form.costs, { costType: "", amount: "" }],
    });
  };

  // 🔹 Remove cost row
  const removeCostRow = (index) => {
    setForm({
      ...form,
      costs: form.costs.filter((_, i) => i !== index),
    });
  };

  // 🔹 Calculate total
  const totalAmount = form.costs.reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0
  );

  // 🔹 Submit expense
  const submitExpense = async () => {
    if (submitting) return;

    if (!form.expenseDate) {
      alert("Please select expense date");
      return;
    }

    if (form.costs.some((c) => !c.costType || !c.amount)) {
      alert("Please fill all cost fields");
      return;
    }

    try {
      setSubmitting(true);

      await axios.post("https://vietnam-shipping-ms-backend-six.vercel.app/api/expenses/bulk-create", {
        containerNumbers: selectedContainerNumbers,
        expenseDate: form.expenseDate,
        remarks: form.remarks,
        costs: form.costs,
      });

      alert("Bulk expenses added successfully!");
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to save expenses");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="expense-container">
      {/* Selected Containers */}
      <div className="input-group full-width readonly">
        <textarea
          readOnly
          value={selectedContainerNumbers.join(", ")}
          className="input-field"
        />
        <label className="floating-label active">
          Selected Containers ({selectedContainerNumbers.length})
        </label>
      </div>

      {/* Expense Date */}
      <div className="input-group">
        <input
          type="date"
          className="input-field"
          value={form.expenseDate}
          onChange={(e) =>
            setForm({ ...form, expenseDate: e.target.value })
          }
        />
        <label className="floating-label">Expense Date</label>
      </div>

      {/* Cost Rows */}
      {form.costs.map((c, i) => (
        <div key={i} className="cost-row-grid">
          <select
            value={c.costType}
            onChange={(e) =>
              handleCostChange(i, "costType", e.target.value)
            }
            className="input-field"
          >
            <option value="" hidden></option>
            {COST_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            className="input-field"
            placeholder="Amount"
            value={c.amount}
            onChange={(e) =>
              handleCostChange(i, "amount", e.target.value)
            }
          />

          {form.costs.length > 1 && (
            <button
              type="button"
              className="remove-cost-btn"
              onClick={() => removeCostRow(i)}
            >
              ✕
            </button>
          )}
        </div>
      ))}

      {/* Add Cost */}
      <button type="button" className="add-cost-btn" onClick={addCostRow}>
        + Add Cost
      </button>

      {/* Remarks */}
      <div className="input-group">
        <textarea
          className="input-field"
          value={form.remarks}
          onChange={(e) =>
            setForm({ ...form, remarks: e.target.value })
          }
        />
        <label className="floating-label">Remarks</label>
      </div>

      {/* Total */}
      <div className="total-display">
        <strong>Total:</strong> ₹ {totalAmount.toLocaleString()}
      </div>

      {/* Submit */}
      <button
        className="main-submit-btn"
        onClick={submitExpense}
        disabled={submitting}
      >
        {submitting ? "Submitting..." : "Submit Bulk Expense"}
      </button>
    </div>
  );
}
