import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Package, DollarSign, Truck, Search, Eye } from "lucide-react";
import "./Dashboard.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ExpenseDashboard from "../Dashboard Sections/ExpenseDashboard";
// import { compile } from "vue/types/umd";

export default function Dashboard() {
  const [shipments, setShipments] = useState([]);
  const [containers, setContainers] = useState([]);
  const [stats, setStats] = useState({
    totalVnd: 0,
    totalContainers: 0,
    activeShipments: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [invoiceFilter, setInvoiceFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [editShipment, setEditShipment] = useState(null);
  const [editForm, setEditForm] = useState({});
  const GOODS_OPTIONS = [
    "Rice",
    "Wheat",
    "Sugar",
    "Maize",
    "Pulses",
    "Fertilizer",
  ];

  const SHIPPING_LINES = [
    "Maersk",
    "MSC",
    "CMA CGM",
    "Hapag-Lloyd",
    "COSCO",
    "ONE",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("https://vietnam-shipping-ms-backend-six.vercel.app/api/shipment/all");
        const res2 = await axios.get("https://vietnam-shipping-ms-backend-six.vercel.app/api/container/all");
        setContainers(res2.data);
        console.log("Fetched Containers:", res2.data);
        setShipments(res.data);

        // Calculate Stats
        const total = res.data.reduce(
          (acc, curr) => acc + (Number(curr.totalValueVnd) || 0),
          0
        );
        const containersCount = res.data.reduce(
          (acc, curr) => acc + (curr.containerIds?.length || 0),
          0
        );

        setStats({
          totalVnd: total,
          totalContainers: containersCount,
          activeShipments: res.data.length,
        });
      } catch (err) {
        console.error("Error fetching dashboard data", err);
      }
    };
    fetchData();
  }, []);

  const filteredShipments = shipments.filter((s) => {
    const searchMatch =
      s.blNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const invoiceMatch = invoiceFilter
      ? s.invoiceNumber?.toLowerCase().includes(invoiceFilter.toLowerCase())
      : true;

    const shipmentDate = s.createdAt ? new Date(s.createdAt) : null;

    const fromMatch = fromDate
      ? shipmentDate && shipmentDate >= new Date(fromDate)
      : true;

    const toMatch = toDate
      ? shipmentDate && shipmentDate <= new Date(toDate)
      : true;

    return searchMatch && invoiceMatch && fromMatch && toMatch;
  });

  const filteredContainer = containers.filter((s) =>
    [
      s.containerNumber,
      s.sealNumber1,
      s.sealNumber2,
      s.status,
      s.uniqueId,
    ].some(
      (field) => field && field.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // console.log("Filtered Containers:", filteredContainer);
  const shipmentContainerIds = new Set(selectedShipment?.containerIds || []);

  console.log("Shipment Container IDs:", shipmentContainerIds);
  const matchedContainers = containers.filter((c) =>
    shipmentContainerIds.has(c.uniqueId)
  );

  console.log("Matched Containers:", matchedContainers);

  const handleEditShipment = (shipment) => {
    setEditShipment(shipment);
    setEditForm({
      invoiceNumber: shipment.invoiceNumber || "",
      blNumber: shipment.blNumber || "",
      goodsName: shipment.goodsName || "",
      shippingLine: shipment.shippingLine || "",
      arrivalPort: shipment.arrivalPort || "",
      netWeight: shipment.netWeight || "",
      totalValueVnd: shipment.totalValueVnd || "",
      eta: shipment.eta ? shipment.eta.split("T")[0] : "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateShipment = async () => {
    try {
      const res = await axios.put(
        `https://vietnam-shipping-ms-backend-six.vercel.app/api/shipment/update/${editShipment._id}`,
        editForm
      );

      // Update UI without reload
      setShipments((prev) =>
        prev.map((s) => (s._id === editShipment._id ? res.data : s))
      );

      setEditShipment(null);
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update shipment");
    }
  };

  const handleDeleteShipment = async (shipmentId) => {
    if (!window.confirm("Are you sure you want to delete this shipment?")) {
      return;
    }

    try {
      await axios.delete(
        `https://vietnam-shipping-ms-backend-six.vercel.app/api/shipment/delete/${shipmentId}`
      );

      // Remove from UI instantly
      setShipments((prev) => prev.filter((s) => s._id !== shipmentId));
      toast.error("Deleted !", {
        position: "top-center",
        autoClose: 3000,
        theme: "colored",
      });
    } catch (error) {
      console.error("Delete failed", error);
      alert("Failed to delete shipment");
    }
  };

  return (
    <div className="dashboard-container">
      <div className="filter-row">
      <ToastContainer />
        {/* Invoice Filter */}
        <input
          type="text"
          placeholder="Filter by Invoice #"
          className="filter-input"
          value={invoiceFilter}
          onChange={(e) => setInvoiceFilter(e.target.value)}
        />

        {/* From Date */}
        <input
          type="date"
          className="filter-input"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        {/* To Date */}
        <input
          type="date"
          className="filter-input"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />

        {/* Clear Button */}
        <button
          className="clear-btn"
          onClick={() => {
            setInvoiceFilter("");
            setFromDate("");
            setToDate("");
            setSearchTerm("");
          }}
        >
          Clear
        </button>
      </div>

      {/* KPI STATS ROW */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon bg-blue">
            <DollarSign />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Inventory Value</span>
            <h3 className="stat-value">{stats.totalVnd.toLocaleString()} ₫</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-green">
            <Truck />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Containers</span>
            <h3 className="stat-value">{stats.totalContainers} Units</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-purple">
            <Package />
          </div>
          <div className="stat-info">
            <span className="stat-label">Active Shipments</span>
            <h3 className="stat-value">{stats.activeShipments}</h3>
          </div>
        </div>
      </div>
      {editShipment && (
        <div className="modal-overlay" onClick={() => setEditShipment(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Shipment</h3>
              <button
                className="close-btn"
                onClick={() => setEditShipment(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="edit-form-grid">
              <input
                name="invoiceNumber"
                value={editForm.invoiceNumber}
                onChange={handleEditChange}
                placeholder="Invoice Number"
              />

              <input
                name="blNumber"
                value={editForm.blNumber}
                onChange={handleEditChange}
                placeholder="BL Number"
              />

              <select
                name="goodsName"
                value={editForm.goodsName}
                onChange={handleEditChange}
              >
                <option value="">Select Goods</option>
                {GOODS_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                name="shippingLine"
                value={editForm.shippingLine}
                onChange={handleEditChange}
              >
                <option value="">Select Shipping Line</option>
                {SHIPPING_LINES.map((line) => (
                  <option key={line} value={line}>
                    {line}
                  </option>
                ))}
              </select>

              <input
                name="arrivalPort"
                value={editForm.arrivalPort}
                onChange={handleEditChange}
                placeholder="Port"
              />

              <input
                name="netWeight"
                value={editForm.netWeight}
                onChange={handleEditChange}
                placeholder="Net Weight"
                type="number"
              />

              <input
                name="totalValueVnd"
                value={editForm.totalValueVnd}
                onChange={handleEditChange}
                placeholder="Total Value (VND)"
                type="number"
              />

              <input
                name="eta"
                value={editForm.eta}
                onChange={handleEditChange}
                type="date"
              />
            </div>

            <div className="modal-actions">
              <button className="save-btn" onClick={handleUpdateShipment}>
                Save Changes
              </button>
              <button
                className="cancel-btn"
                onClick={() => setEditShipment(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH AND TABLE SECTION */}
      <div className="table-section">
        <div className="table-header">
          <h3>Shipment Master Records</h3>
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search BL or Invoice..."
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>BL Number</th>
                <th>Goods Name</th>
                <th>Containers</th>
                <th>Net Weight</th>
                <th>ETA</th>
                <th>Total Value (VND)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((shipment) => (
                <tr key={shipment._id}>
                  <td className="font-bold">{shipment.invoiceNumber}</td>
                  <td>{shipment.blNumber}</td>
                  <td>
                    <span className="badge">{shipment.goodsName}</span>
                  </td>
                  <td>{shipment.containerIds?.length || 0} Units</td>
                  <td>{shipment.netWeight} Kgs</td>
                  <td>
                    {shipment.eta
                      ? new Date(shipment.eta).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="text-blue font-mono">
                    {shipment.totalValueVnd?.toLocaleString()} ₫
                  </td>
                  <td className="action-cell">
                    {/* View */}
                    <button
                      className="view-btn"
                      onClick={() => setSelectedShipment(shipment)}
                    >
                      <Eye size={16} />
                    </button>

                    {/* Edit */}
                    <button
                      className="edit-btn"
                      onClick={() => handleEditShipment(shipment)}
                    >
                      ✏️
                    </button>

                    {/* Delete */}
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteShipment(shipment._id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SECTION */}
      {selectedShipment && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedShipment(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Shipment Details: {selectedShipment.invoiceNumber}</h3>
              <button
                className="close-btn"
                onClick={() => setSelectedShipment(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-grid">
              <div className="info-item">
                <strong>BL Number:</strong> {selectedShipment.blNumber}
              </div>
              <div className="info-item">
                <strong>Shipping Line:</strong> {selectedShipment.shippingLine}
              </div>
              <div className="info-item">
                <strong>Port:</strong> {selectedShipment.arrivalPort}
              </div>
              <div className="info-item">
                <strong>Goods:</strong> {selectedShipment.goodsName}
              </div>
            </div>

            <h4 className="container-title">Container Breakdown</h4>
            <div className="modal-table-wrapper">
              <table className="modal-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Unique ID</th>
                    <th>Container Number</th>
                    <th>Seal Number 1</th>
                    <th>Seal Number 2</th>
                  </tr>
                </thead>
                <tbody>
                  {matchedContainers.length > 0 ? (
                    matchedContainers.map((c, index) => (
                      <tr key={c._id}>
                        <td>{index + 1}</td>

                        <td>
                          <code className="uid-text">{c.uniqueId}</code>
                        </td>

                        <td>{c.containerNumber}</td>

                        <td>{c.sealNumber1?.trim() || "-"}</td>
                        <td>{c.sealNumber2?.trim() || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <ExpenseDashboard/>
    </div>
  );
}
