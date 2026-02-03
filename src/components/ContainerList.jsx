import { Fragment, useEffect, useState } from "react";
import axios from "axios";
import ExpenseForm from "./ExpenseForm";
import "./ContainerList.css";

export default function ContainerList() {
  const [shipments, setShipments] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const [selectedContainers, setSelectedContainers] = useState([]);
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState("");
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // 🔹 Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const LIMIT = 30;

  // 🔹 Load first 30 days
  useEffect(() => {
    loadShipments(1);
  }, []);

  // 🔹 API loader
  const loadShipments = async (pageNumber) => {
    if (loading) return;

    setLoading(true);
    try {
      const res = await axios.get(
        `https://vietnam-shipping-ms-backend-six.vercel.app/api/shipment/all?page=${pageNumber}&limit=${LIMIT}`,
      );

      if (res.data.length < LIMIT) {
        setHasMore(false); // no more records
      }

      if (pageNumber === 1) {
        setShipments(res.data);
      } else {
        setShipments((prev) => [...prev, ...res.data]);
      }
    } catch (err) {
      console.error("Failed to load shipments", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 UI helpers
  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleContainer = (uid) => {
    setSelectedContainers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid],
    );
  };

  const toggleSelectAllContainers = (containers) => {
    const allSelected = containers.every((c) => selectedContainers.includes(c));

    if (allSelected) {
      // ❌ Unselect all of this shipment
      setSelectedContainers((prev) =>
        prev.filter((c) => !containers.includes(c)),
      );
    } else {
      // ✅ Select all of this shipment
      setSelectedContainers((prev) => [...new Set([...prev, ...containers])]);
    }
  };

  const closeModal = () => {
    setShowExpenseModal(false);
    setSelectedContainers([]);
    setSelectedInvoiceNumber("");
  };

  return (
    <div className="list-wrapper">
      <div className="container-card">
        <h2 className="title">Shipment Inventory</h2>

        <div className="table-responsive">
          <table className="container-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>BL No</th>
                <th>Shipping Line</th>
                <th className="text-center">Details</th>
              </tr>
            </thead>

            <tbody>
              {shipments.map((s) => (
                <Fragment key={s._id}>
                  <tr className={expandedId === s._id ? "row-active" : ""}>
                    <td className="font-bold">{s.invoiceNumber}</td>
                    <td>{s.blNumber}</td>
                    <td>{s.shippingLine}</td>
                    <td className="text-center">
                      <button
                        className="eye-btn"
                        onClick={() => toggleExpand(s._id)}
                      >
                        {expandedId === s._id ? "✖" : "👁"}
                      </button>
                    </td>
                  </tr>

                  {expandedId === s._id && (
                    <tr className="expand-row">
                      <td colSpan="4">
                        <div className="expand-box animate-in">
                          <div className="detail-grid wide">
                            <div className="detail-item">
                              <label>Invoice</label>
                              <span>{s.invoiceNumber}</span>
                            </div>
                            <div className="detail-item">
                              <label>BL</label>
                              <span>{s.blNumber}</span>
                            </div>
                            <div className="detail-item">
                              <label>Goods</label>
                              <span>{s.goodsName}</span>
                            </div>
                            <div className="detail-item">
                              <label>Arrival Port</label>
                              <span>{s.arrivalPort}</span>
                            </div>
                          </div>

                          {/* Containers */}
                          <div className="container-id-section">
                            <h4>Select Containers</h4>
                            <button
                              className="select-all-btn"
                              onClick={() =>
                                toggleSelectAllContainers(s.containerNumber)
                              }
                            >
                              {s.containerNumber.every((c) =>
                                selectedContainers.includes(c),
                              )
                                ? "Unselect All"
                                : "Select All"}
                            </button>

                            {s.containerNumber.map((uid) => (
                              <label
                                key={uid}
                                className="container-id-row checkbox"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedContainers.includes(uid)}
                                  onChange={() => toggleContainer(uid)}
                                />
                                <span className="uid-badge">{uid}</span>
                              </label>
                            ))}

                            {selectedContainers.length > 0 && (
                              <button
                                className="apply-btn bulk"
                                onClick={() => {
                                  setSelectedInvoiceNumber(s.invoiceNumber);
                                  setShowExpenseModal(true);
                                }}
                              >
                                Add Bulk Expense ({selectedContainers.length})
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🔹 SHOW MORE BUTTON */}
        {hasMore && (
          <div className="load-more-wrapper">
            <button
              className="apply-btn"
              disabled={loading}
              onClick={() => {
                const nextPage = page + 1;
                setPage(nextPage);
                loadShipments(nextPage);
              }}
            >
              {loading ? "Loading..." : "Show More (Previous 30 Days)"}
            </button>
          </div>
        )}
      </div>

      {/* 🔹 BULK EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Bulk Expense</h3>
              <button className="modal-close-icon" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <ExpenseForm
                selectedContainerNumbers={selectedContainers}
                invoiceNumber={selectedInvoiceNumber}
                onSuccess={closeModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
