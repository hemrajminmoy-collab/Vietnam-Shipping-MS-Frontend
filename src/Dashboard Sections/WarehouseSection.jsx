import React, { useEffect, useState } from "react";
import axios from "axios";
import "./WarehouseSection.css";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function WarehouseSection() {
  const [shipments, setShipments] = useState([]);
  const [records, setRecords] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [containers, setContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [queuedContainers, setQueuedContainers] = useState([]);

  const [form, setForm] = useState({
    containerNumber: "",
    invoiceNumber: "",
    blNumber: "",
    sealNumber1: "",
    sealNumber2: "",
    grossWeight: "",
    netWeight: "",
    numberOfBags: "",
    value: "",
    shippingLine: "",
    nameOfGoods: "",
    arrivalPort: "",

    warehouseName: "Thanh Binh",
    receivedDate: new Date().toISOString().slice(0, 10),
    bagsReceived: "",
    netWeightReceived: "",
    truckNumber: "",
    truckingAgent: "",
    cha: "",
    notes: "",
    sellingDirect: false,
    saleTarget: "warehouse", // or 'customer'
    customerName: "",
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, wRes, eRes] = await Promise.all([
        axios.get("https://vietnam-shipping-ms-backend-six.vercel.app/api/shipment/all"),
        axios.get("https://vietnam-shipping-ms-backend-six.vercel.app/api/warehouse/all"),
        axios.get("https://vietnam-shipping-ms-backend-six.vercel.app/api/expenses/all"),
      ]);
      setShipments(sRes.data || []);
      setRecords(wRes.data || []);
      setExpenses(eRes.data || []);
      // fetch customers too (if endpoint exists)
      try {
        const cRes = await axios.get("https://vietnam-shipping-ms-backend-six.vercel.app/api/customer/all");
        setCustomers(cRes.data || []);
      } catch (err) {
        // ignore if customer API not present yet
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleChange = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        grossWeight: Number(form.grossWeight || 0),
        netWeight: Number(form.netWeight || 0),
        numberOfBags: Number(form.numberOfBags || 0),
        value: Number(form.value || 0),
        bagsReceived: Number(form.bagsReceived || 0),
        netWeightReceived: Number(form.netWeightReceived || 0),
        receivedDate: form.receivedDate,
      };
      const res = await axios.post("https://vietnam-shipping-ms-backend-six.vercel.app/api/warehouse", payload);
      setRecords((prev) => [res.data, ...prev]);
      alert("Warehouse record saved");
    } catch (err) {
      console.error(err);
      alert("Failed to save record");
    }
  };

  const formatCurrency = (v = 0) => (v ? "₫ " + Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "-");

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm("Are you sure you want to delete this warehouse record?")) return;
    try {
      await axios.delete(`https://vietnam-shipping-ms-backend-six.vercel.app/api/warehouse/${recordId}`);
      setRecords((prev) => prev.filter((r) => r._id !== recordId));
      alert("Warehouse record deleted successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to delete record");
    }
  };

  const exportInvoiceToPDF = async (invoiceNumber) => {
    try {
      // Get all records for this invoice
      const invoiceRecords = records.filter(r => r.invoiceNumber === invoiceNumber);
      const invoiceExpenses = expenses.filter(ex => ex.invoiceNumber === invoiceNumber);
      const invoiceShipment = shipments.find(s => s.invoiceNumber === invoiceNumber);

      if (invoiceRecords.length === 0) {
        alert("No records found for this invoice");
        return;
      }

      // Create HTML content for PDF
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="border-bottom: 3px solid #2563eb; padding-bottom: 10px;">Warehouse Receipt Report</h2>
          
          <div style="margin: 20px 0;">
            <h3>Invoice Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold;">Invoice Number:</td>
                <td style="padding: 8px;">${invoiceNumber}</td>
                <td style="padding: 8px; font-weight: bold;">Report Date:</td>
                <td style="padding: 8px;">${new Date().toLocaleDateString()}</td>
              </tr>
              ${invoiceShipment ? `
              <tr>
                <td style="padding: 8px; font-weight: bold;">Goods Name:</td>
                <td style="padding: 8px;">${invoiceShipment.goodsName || invoiceShipment.nameOfGoods || "-"}</td>
                <td style="padding: 8px; font-weight: bold;">Arrival Port:</td>
                <td style="padding: 8px;">${invoiceShipment.arrivalPort || "-"}</td>
              </tr>
              ` : ""}
            </table>
          </div>

          <div style="margin: 20px 0;">
            <h3>Warehouse Records</h3>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Container</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Warehouse</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Received Date</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Bags Rx</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Net Weight Rx</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Truck</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceRecords.map(r => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">${r.containerNumber}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${r.warehouseName}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${r.receivedDate ? new Date(r.receivedDate).toLocaleDateString() : "-"}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${r.bagsReceived}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${r.netWeightReceived}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${r.truckNumber}</td>
                </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          ${invoiceExpenses.length > 0 ? `
          <div style="margin: 20px 0;">
            <h3>Expenses</h3>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Cost Type</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Amount</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Date</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceExpenses.map(ex => (ex.costs || []).map(c => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">${c.costType || "-"}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">₫ ${Number(c.amount || 0).toLocaleString()}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${ex.expenseDate ? new Date(ex.expenseDate).toLocaleDateString() : "-"}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${ex.remarks || "-"}</td>
                </tr>
                `).join("")).join("")}
              </tbody>
            </table>
            <div style="margin-top: 10px; text-align: right; font-weight: bold;">
              Total Expenses: ₫ ${invoiceExpenses.reduce((s, ex) => s + (ex.costs || []).reduce((ss, c) => ss + Number(c.amount || 0), 0), 0).toLocaleString()}
            </div>
          </div>
          ` : ""}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #6b7280; font-size: 12px;">
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;

      // Create temporary container
      const element = document.createElement("div");
      element.innerHTML = htmlContent;
      element.style.position = "absolute";
      element.style.left = "-9999px";
      document.body.appendChild(element);

      // Convert to canvas and then PDF
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`Invoice_${invoiceNumber}_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.removeChild(element);
      alert("PDF exported successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF");
    }
  };

  const exportShipmentToPDF = async (shipment) => {
    try {
      // Get all records and expenses for this shipment's invoice
      const invoice = shipment.invoiceNumber;
      const invoiceRecords = records.filter(r => r.invoiceNumber === invoice);
      const invoiceExpenses = expenses.filter(ex => ex.invoiceNumber === invoice);

      // Create HTML content for PDF
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="border-bottom: 3px solid #2563eb; padding-bottom: 10px;">Shipment Details Report</h2>
          
          <div style="margin: 20px 0;">
            <h3>Shipment Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold;">Invoice Number:</td>
                <td style="padding: 8px;">${invoice}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Container Number:</td>
                <td style="padding: 8px;">${Array.isArray(shipment.containerNumber) ? shipment.containerNumber.join(", ") : shipment.containerNumber}</td>
                <td style="padding: 8px; font-weight: bold;">BL Number:</td>
                <td style="padding: 8px;">${shipment.blNumber || shipment.bl_number || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Goods Name:</td>
                <td style="padding: 8px;">${shipment.goodsName || shipment.nameOfGoods || "-"}</td>
                <td style="padding: 8px; font-weight: bold;">Arrival Port:</td>
                <td style="padding: 8px;">${shipment.arrivalPort || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Arrival Date:</td>
                <td style="padding: 8px;">${shipment.eta ? new Date(shipment.eta).toLocaleDateString() : (shipment.arrivalDate ? new Date(shipment.arrivalDate).toLocaleDateString() : "-")}</td>
                <td style="padding: 8px; font-weight: bold;">Shipping Line:</td>
                <td style="padding: 8px;">${shipment.shippingLine || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Gross Weight:</td>
                <td style="padding: 8px;">${shipment.grossWeight || shipment.totalGross || "-"} kg</td>
                <td style="padding: 8px; font-weight: bold;">Net Weight:</td>
                <td style="padding: 8px;">${shipment.netWeight || "-"} kg</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Shipping Line:</td>
                <td style="padding: 8px;">${shipment.shippingLine || "-"}</td>
              </tr>
            </table>
          </div>

          ${invoiceRecords.length > 0 ? `
          <div style="margin: 20px 0;">
            <h3>Warehouse Records</h3>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Container</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Warehouse</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Received Date</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Bags Rx</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Net Weight Rx</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceRecords.map(r => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">${r.containerNumber}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${r.warehouseName}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${r.receivedDate ? new Date(r.receivedDate).toLocaleDateString() : "-"}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${r.bagsReceived}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${r.netWeightReceived}</td>
                </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
          ` : ""}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #6b7280; font-size: 12px;">
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;

      // Create temporary container
      const element = document.createElement("div");
      element.innerHTML = htmlContent;
      element.style.position = "absolute";
      element.style.left = "-9999px";
      document.body.appendChild(element);

      // Convert to canvas and then PDF
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`Shipment_${invoice}_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.removeChild(element);
      alert("PDF exported successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF");
    }
  };

  const handleAssignFromShipment = (sh) => {
    // Extract containers from shipment
    let containerList = [];
    if (Array.isArray(sh.containerNumber)) {
      containerList = sh.containerNumber.map(c => ({ containerNumber: c, shipmentData: sh }));
    } else if (sh.containerNumber) {
      containerList = [{ containerNumber: sh.containerNumber, shipmentData: sh }];
    }
    
    setContainers(containerList);
    setQueuedContainers([]);
    setSelectedContainer(null);
    setShowForm(true);
    
    // Close modal
    setSelectedShipment(null);
    setSelectedRecord(null);
  };

  const openDetailsForShipment = (sh) => {
    setSelectedShipment(sh);
  };

  const openDetailsForRecord = (r) => {
    setSelectedRecord(r);
  };

  return (
    <div className="warehouse-section">
      <h2 className="page-title">Warehouse</h2>

      <div className="warehouse-container">
        <div className="warehouse-table-card" style={{ flex: "1 1 100%" }}>
          <h3>Shipments</h3>
          {loading ? (
            <div>Loading…</div>
          ) : (
            <div className="table-wrapper">
              <table className="warehouse-table">
                <thead>
                  <tr>
           
                    <th>Container No</th>
                    <th>Invoice</th>
                    <th>BL</th>
                
                    <th>Gross (kg)</th>
                    <th>Net (kg)</th>
                    <th>No of Bags</th>
                    <th>Value</th>
                    <th>Shipping Line</th>
                    <th>Goods</th>
                    <th>Arrival Port</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((s) => (
                    <tr key={s._id || s.uniqueId}>
                      <td>{Array.isArray(s.containerNumber) ? s.containerNumber.join(", ") : s.containerNumber}</td>
                      <td>{s.invoiceNumber}</td>
                      <td>{s.blNumber || s.bl_number}</td>

                      <td>{s.grossWeight || s.totalGross || ""}</td>
                      <td>{s.netWeight || ""}</td>
                      <td>{s.noOfBags || s.numberOfBags || ""}</td>
                      <td>{s.totalValueVnd || s.value || ""}</td>
                      <td>{s.shippingLine}</td>
                      <td>{s.goodsName || s.nameOfGoods}</td>
                      <td>{s.arrivalPort}</td>
                      <td>
                        <button className="action-btn" title="View shipment" onClick={() => openDetailsForShipment(s)}>👁️</button>
                        <button className="action-btn" title="Export to PDF" onClick={() => exportShipmentToPDF(s)} style={{ marginLeft: 8, background: "#8b5cf6", color: "white" }}>📄</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 style={{ marginTop: 18 }}>Warehouse Records</h3>
          {loading ? (
            <div>Loading…</div>
          ) : (
            <div className="table-wrapper">
              <table className="warehouse-table">
                <thead>
                  <tr>
                    <th>Container No</th>
                    <th>Invoice</th>
                    <th>BL</th>
                    <th>Gross (kg)</th>
                    <th>Net (kg)</th>
                    <th>Bags</th>
                    {/* <th>Value</th> */}
                    <th>Warehouse</th>
                    <th>Received</th>
                    <th>Bags Rx</th>
                    {/* <th>Expenses</th> */}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const invoice = r.invoiceNumber || "";
                    const totalExp = expenses
                      .filter((ex) => ex.invoiceNumber === invoice)
                      .reduce((s, ex) => s + (ex.costs || []).reduce((ss, c) => ss + Number(c.amount || 0), 0), 0);
                    return (
                      <tr key={r._id}>
                        <td>{r.containerNumber}</td>
                        <td>{r.invoiceNumber}</td>
                        <td>{r.blNumber}</td>

                        <td>{r.grossWeight}</td>
                        <td>{r.netWeight}</td>
                        <td>{r.numberOfBags}</td>
                        {/* <td>{r.value}</td> */}
                        <td>{r.warehouseName}</td>
                        <td>{r.receivedDate ? new Date(r.receivedDate).toLocaleDateString() : ""}</td>
                        <td>{r.bagsReceived}</td>
                        {/* <td>{formatCurrency(totalExp)}</td> */}
                        <td>
                          <button className="action-btn" title="View details" onClick={() => openDetailsForRecord(r)}>👁️</button>
                          <button className="action-btn" title="Delete record" onClick={() => handleDeleteRecord(r._id)} style={{ marginLeft: 8, background: "#ef4444", color: "white" }}>🗑️</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <h3 style={{ marginTop: 18 }}>Customer Records</h3>
          {loading ? (
            <div>Loading…</div>
          ) : (
            <div className="table-wrapper">
              <table className="warehouse-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Container No</th>
                    <th>Invoice</th>
                    <th>BL</th>
                    <th>Gross (kg)</th>
                    <th>Net (kg)</th>
                    <th>Bags</th>
                    {/* <th>Value</th> */}
                    <th>Received</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c._id}>
                      <td>{c.customerName}</td>
                      <td>{c.containerNumber}</td>
                      <td>{c.invoiceNumber}</td>
                      <td>{c.blNumber}</td>
                      <td>{c.grossWeight}</td>
                      <td>{c.netWeight}</td>
                      <td>{c.numberOfBags}</td>
                      {/* <td>{c.value}</td> */}
                      <td>{c.receivedDate ? new Date(c.receivedDate).toLocaleDateString() : ""}</td>
                      <td>
                        <button className="action-btn" title="View" onClick={() => openDetailsForRecord(c)}>👁️</button>
                        <button className="action-btn" title="Delete" onClick={async () => {
                          if (!window.confirm("Delete this customer record?")) return;
                          try {
                            await axios.delete(`https://vietnam-shipping-ms-backend-six.vercel.app/api/customer/${c._id}`);
                            setCustomers(prev => prev.filter(x => x._id !== c._id));
                            alert("Customer record deleted");
                          } catch (err) {
                            console.error(err);
                            alert("Failed to delete");
                          }
                        }} style={{ marginLeft: 8, background: "#ef4444", color: "white" }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal Popup */}
      {showForm && (
        <div
          style={{ position: "fixed", zIndex: 1500, left: 0, top: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowForm(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: "92%", maxWidth: 900, background: "#fff", borderRadius: 8, padding: 24, maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ margin: 0 }}>Receive Into Warehouse</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "#e5e7eb", border: "none", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>

            {/* Container Selector */}
            <div style={{ marginBottom: 20, padding: 12, background: "#f9fafb", borderRadius: 6 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                Select Container to Receive
              </label>
              <select 
                value={selectedContainer ? selectedContainer.containerNumber : ""} 
                onChange={(e) => {
                  const selected = containers.find(c => c.containerNumber === e.target.value);
                  setSelectedContainer(selected);
                }}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid #d1d5db", fontSize: 14 }}
              >
                <option value="">-- Select a container --</option>
                {containers.map((c, i) => (
                  <option key={i} value={c.containerNumber}>
                    {c.containerNumber}
                  </option>
                ))}
              </select>
              <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
                {containers.length} container(s) available | {queuedContainers.length} queued
              </div>
            </div>

            {/* Selected Container Form */}
            {selectedContainer && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const newQueued = {
                  ...form,
                  containerNumber: selectedContainer.containerNumber,
                  invoiceNumber: selectedContainer.shipmentData.invoiceNumber || "",
                  blNumber: selectedContainer.shipmentData.blNumber || selectedContainer.shipmentData.bl_number || "",
                  grossWeight: Number(form.grossWeight || selectedContainer.shipmentData.grossWeight || 0),
                  netWeight: Number(form.netWeight || selectedContainer.shipmentData.netWeight || 0),
                  numberOfBags: Number(form.numberOfBags || selectedContainer.shipmentData.noOfBags || 0),
                  value: Number(form.value || selectedContainer.shipmentData.totalValueVnd || 0),
                  bagsReceived: Number(form.bagsReceived || 0),
                  netWeightReceived: Number(form.netWeightReceived || 0),
                  receivedDate: form.receivedDate,
                  warehouseName: form.warehouseName,
                  sellingDirect: form.sellingDirect || false,
                  saleTarget: form.saleTarget || "warehouse",
                  customerName: form.customerName || "",
                };
                
                // Check if already queued
                const alreadyQueued = queuedContainers.some(q => q.containerNumber === selectedContainer.containerNumber);
                if (alreadyQueued) {
                  // Update existing
                  setQueuedContainers(queuedContainers.map(q => 
                    q.containerNumber === selectedContainer.containerNumber ? newQueued : q
                  ));
                } else {
                  // Add new
                  setQueuedContainers([...queuedContainers, newQueued]);
                }
                
                // Move to next container
                const nextContainer = containers.find(c => !queuedContainers.some(q => q.containerNumber === c.containerNumber) && c.containerNumber !== selectedContainer.containerNumber);
                if (nextContainer) {
                  setSelectedContainer(nextContainer);
                  setForm({ ...form, warehouseName: "Thanh Binh" });
                } else {
                  setSelectedContainer(null);
                }
              }} className="warehouse-form">
                <h4 style={{ marginTop: 0, marginBottom: 12, color: "#1f2937" }}>Container: {selectedContainer.containerNumber}</h4>
                
                <label>
                  Locations 
                  <select value={form.warehouseName} onChange={(e) => handleChange("warehouseName", e.target.value)}>
                    <option>Thanh Binh</option>
                    <option>P & C</option>
                    <option>CAT LAI PORT</option>

                  </select>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={form.sellingDirect} onChange={(e) => handleChange("sellingDirect", e.target.checked)} />
                  Selling direct to customer
                </label>

                {form.sellingDirect && (
                  <label>
                    Sell To
                    <select value={form.saleTarget} onChange={(e) => handleChange("saleTarget", e.target.value)}>
                      <option value="customer 1">Customer 1</option>
                      <option value="customer">Customer</option>
                    </select>
                  </label>
                )}

                {form.sellingDirect && form.saleTarget === "customer" && (
                  <label>
                    Customer Name
                    <input value={form.customerName} onChange={(e) => handleChange("customerName", e.target.value)} />
                  </label>
                )}

                <label>
                  Received Date
                  <input type="date" value={form.receivedDate} onChange={(e) => handleChange("receivedDate", e.target.value)} />
                </label>

                <label>
                  Gross Weight (Kgs)
                  <input type="number" value={form.grossWeight} onChange={(e) => handleChange("grossWeight", e.target.value)} />
                </label>

                <label>
                  Net Weight (Kgs)
                  <input type="number" value={form.netWeight} onChange={(e) => handleChange("netWeight", e.target.value)} />
                </label>

                <label>
                  Number of Bags
                  <input type="number" value={form.numberOfBags} onChange={(e) => handleChange("numberOfBags", e.target.value)} />
                </label>

                <label>
                  Bags Received
                  <input type="number" value={form.bagsReceived} onChange={(e) => handleChange("bagsReceived", e.target.value)} />
                </label>

                <label>
                  Net Weight Received (Kgs)
                  <input type="number" value={form.netWeightReceived} onChange={(e) => handleChange("netWeightReceived", e.target.value)} />
                </label>

                <label>
                  Truck Number
                  <input value={form.truckNumber} onChange={(e) => handleChange("truckNumber", e.target.value)} />
                </label>

                <label>
                  Trucking Agent
                  <input value={form.truckingAgent} onChange={(e) => handleChange("truckingAgent", e.target.value)} />
                </label>

                <label>
                  CHA
                  <input value={form.cha} onChange={(e) => handleChange("cha", e.target.value)} />
                </label>

                <label>
                  Notes
                  <textarea value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} />
                </label>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                  <button type="submit" style={{ padding: "8px 16px", borderRadius: 6, background: "#3b82f6", color: "white", border: "none", cursor: "pointer" }}>Queue This Container</button>
                </div>
              </form>
            )}

            {/* Queued Containers Table */}
            {queuedContainers.length > 0 && (
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "2px solid #f3f4f6" }}>
                <h4 style={{ marginTop: 0, marginBottom: 12 }}>Queued Containers ({queuedContainers.length})</h4>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                        <th style={{ padding: 8, textAlign: "left" }}>Container</th>
                        <th style={{ padding: 8, textAlign: "left" }}>Warehouse</th>
                        <th style={{ padding: 8, textAlign: "left" }}>Bags Rx</th>
                        <th style={{ padding: 8, textAlign: "left" }}>Net Weight Rx</th>
                        <th style={{ padding: 8, textAlign: "left" }}>Truck</th>
                        <th style={{ padding: 8, textAlign: "center" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queuedContainers.map((q, i) => (
                        <React.Fragment key={i}>
                          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td style={{ padding: 8 }}>{q.containerNumber}</td>
                            <td style={{ padding: 8 }}>{q.warehouseName}</td>
                            <td style={{ padding: 8 }}>{q.bagsReceived}</td>
                            <td style={{ padding: 8 }}>{q.netWeightReceived}</td>
                            <td style={{ padding: 8 }}>{q.truckNumber}</td>
                            <td style={{ padding: 8, textAlign: "center" }}>
                              <button 
                                onClick={() => setQueuedContainers(queuedContainers.filter((_, idx) => idx !== i))}
                                style={{ padding: "4px 8px", background: "#ef4444", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>

                          {q.sellingDirect && q.saleTarget === "customer" && (
                            <tr style={{ background: "#f8fafc" }}>
                              <td colSpan={6} style={{ padding: 10, color: "#1f2937" }}>
                                <strong>Customer:</strong> {q.customerName || "(no name provided)"}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                  <button 
                    onClick={() => setShowForm(false)} 
                    style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #d1d5db", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        // Save all queued containers - split by target
                        const warehouseQs = queuedContainers.filter(q => !(q.sellingDirect && q.saleTarget === "customer"));
                        const customerQs = queuedContainers.filter(q => q.sellingDirect && q.saleTarget === "customer");

                        const promises = [
                          ...warehouseQs.map(q => axios.post("https://vietnam-shipping-ms-backend-six.vercel.app/api/warehouse", q)),
                          ...customerQs.map(q => axios.post("https://vietnam-shipping-ms-backend-six.vercel.app/api/customer", q)),
                        ];

                        await Promise.all(promises);
                        // Refresh data from server so we get saved records with IDs
                        await fetchAll();
                        alert(`${queuedContainers.length} container(s) saved successfully`);
                        setShowForm(false);
                        setQueuedContainers([]);
                        setSelectedContainer(null);
                      } catch (err) {
                        console.error(err);
                        alert("Failed to save containers");
                      }
                    }}
                    style={{ padding: "8px 16px", borderRadius: 6, background: "#10b981", color: "white", border: "none", cursor: "pointer" }}
                  >
                    Save All {queuedContainers.length} Container(s)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Details modal for shipment or record */}
      {(selectedShipment || selectedRecord) && (
        <div
          style={{ position: "fixed", zIndex: 1400, left: 0, top: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => { setSelectedShipment(null); setSelectedRecord(null); }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: "92%", maxWidth: 960, background: "#fff", borderRadius: 8, padding: 20, maxHeight: "80vh", overflow: "auto" }}>
            <h3 style={{ marginTop: 0 }}>Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {(() => {
                const d = selectedShipment || selectedRecord;
                return (
                  <>
                    <div>
                      <strong>Container:</strong>
                      <div>{Array.isArray(d.containerNumber) ? d.containerNumber.join(", ") : d.containerNumber || "-"}</div>
                    </div>
                    <div>
                      <strong>Invoice:</strong>
                      <div>{d.invoiceNumber || "-"}</div>
                    </div>
                    <div>
                      <strong>BL Number:</strong>
                      <div>{d.blNumber || d.bl_number || "-"}</div>
                    </div>
                    
                    <div>
                      <strong>Gross (kg):</strong>
                      <div>{d.grossWeight || d.totalGross || "-"}</div>
                    </div>
                    <div>
                      <strong>Net (kg):</strong>
                      <div>{d.netWeight || "-"}</div>
                    </div>
                    <div>
                      <strong>No of Bags:</strong>
                      <div>{d.noOfBags || d.numberOfBags || "-"}</div>
                    </div>
                    <div>
                      <strong>Value:</strong>
                      <div>{formatCurrency(d.totalValueVnd || d.value || 0)}</div>
                    </div>
                    <div>
                      <strong>Shipping Line:</strong>
                      <div>{d.shippingLine || "-"}</div>
                    </div>
                    <div>
                      <strong>Name of Goods:</strong>
                      <div>{d.goodsName || d.nameOfGoods || "-"}</div>
                    </div>
                    <div>
                      <strong>Arrival Port:</strong>
                      <div>{d.arrivalPort || "-"}</div>
                    </div>
                  </>
                );
              })()}
            </div>

            <hr style={{ margin: "12px 0" }} />

            <h4>Expenses for Invoice {((selectedShipment || selectedRecord) && (selectedShipment || selectedRecord).invoiceNumber) || "-"}</h4>
            <div>
              {(expenses || []).filter((ex) => ex.invoiceNumber === ((selectedShipment || selectedRecord) && (selectedShipment || selectedRecord).invoiceNumber || "")).length === 0 ? (
                <div style={{ color: "#6b7280" }}>No expenses found for this invoice</div>
              ) : (
                (expenses || [])
                  .filter((ex) => ex.invoiceNumber === ((selectedShipment || selectedRecord) && (selectedShipment || selectedRecord).invoiceNumber || ""))
                  .map((ex) => (
                    <div key={ex._id} style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div><strong>{ex.invoiceNumber}</strong> — {ex.remarks || ""}</div>
                        <div style={{ color: "#6b7280" }}>{ex.expenseDate ? new Date(ex.expenseDate).toLocaleDateString() : ""}</div>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        {(ex.costs || []).map((c, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                            <div>{c.costType || "-"}</div>
                            <div>{formatCurrency(Number(c.amount || 0))}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <button onClick={() => { setSelectedShipment(null); setSelectedRecord(null); }} style={{ padding: "8px 12px", borderRadius: 6 }}>Close</button>
              <button
                onClick={() => {
                  const src = selectedShipment || selectedRecord;
                  if (src) handleAssignFromShipment(src);
                  setSelectedShipment(null);
                  setSelectedRecord(null);
                }}
                style={{ padding: "8px 12px", borderRadius: 6, background: "#10b981", color: "white", border: "none" }}
              >
                Fill Form
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
