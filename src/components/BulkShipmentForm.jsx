import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash2, Calculator } from "lucide-react";
import "./BulkShipment.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function BulkShipmentForm() {
  const fetchUID = async () => {
    const res = await axios.get(
      "https://vietnam-shipping-ms-backend-six.vercel.app/api/generate-uid",
    );
    return res.data.uid;
  };

  // 1. Specific Containers State
  const [containers, setContainers] = useState([
    {
      id: Date.now(),
      uniqueId: "",
      containerNumber: "",
      seal1: "",
      seal2: "",
      grossWeight: 0,
      netWeight: 0,
      noOfBags: 0,
    },
  ]);

  // 2. Common Shipment Data State
  const [shipmentData, setShipmentData] = useState({
    invoiceNumber: "",
    blNumber: "",
    grossWeight: 0,
    netWeight: 0,
    noOfBags: 0,
    shippingLine: "",
    goodsName: "",
    arrivalPort: "",
    eta: "",
    pricePerKgUsd: 0,
    exchangeRate: 24500,
  });

  //   const [products, setProducts] = useState([]);

  //   useEffect(() => {
  //     // Fetch product master for the dropdown
  //     const fetchProducts = async () => {
  //       const res = await axios.get('http://localhost:5000/api/products');
  //       setProducts(res.data);
  //     };
  //     fetchProducts();
  //   }, []);

  // Logic: Auto Calculate Total Value

  const totalValueVnd =
    shipmentData.netWeight *
    shipmentData.pricePerKgUsd *
    shipmentData.exchangeRate;

  // Handler: Add a new container row
  const addContainerRow = async () => {
    const uid = await fetchUID();

    setContainers([
      ...containers,
      {
        id: Date.now(),
        uniqueId: uid, // <--- Auto generates for new row
        containerNumber: "",
        seal1: "",
        seal2: "",
        grossWeight: 0,
        netWeight: 0,
        noOfBags: 0,
      },
    ]);
  };

  // Handler: Remove a container row
  const removeContainerRow = (id) => {
    setContainers(containers.filter((c) => c.id !== id));
  };

  useEffect(() => {
    const totalGross = containers.reduce(
      (sum, c) => sum + (Number(c.grossWeight) || 0),
      0,
    );
    const totalNet = containers.reduce(
      (sum, c) => sum + (Number(c.netWeight) || 0),
      0,
    );
    const totalBags = containers.reduce(
      (sum, c) => sum + (Number(c.noOfBags) || 0),
      0,
    );

    setShipmentData((prev) => ({
      ...prev,
      grossWeight: totalGross,
      netWeight: totalNet,
      noOfBags: totalBags,
    }));
  }, [containers, shipmentData.pricePerKgUsd, shipmentData.exchangeRate]);

  // Handler: Update specific container field
  const updateContainer = (id, field, value) => {
    setContainers(
      containers.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      containers, // The list of 5, 10, or 20 containers
      ...shipmentData,
      totalValueVnd,
    };

    try {
      await axios.post(
        "https://vietnam-shipping-ms-backend-six.vercel.app/api/shipment/bulk",
        payload,
      );
      // console.log("countryOfOrigin:", shipmentData.countryOfOrigin);
      toast.success("Shipment submitted successfully!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    } catch (err) {
      toast.error("Failed to submit shipment", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    }
  };

  return (
    <div className="shipment-card">
      <ToastContainer />
      <h2 className="shipment-title">New Shipment & Container Entry</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-section mt-8">
          <div className="flex-header">
            <h3 className="section-label">Container List</h3>
            <button type="button" onClick={addContainerRow} className="add-btn">
              <Plus size={18} /> Add Container
            </button>
          </div>

          <div className="container-table">
            {containers.map((container, index) => (
              <div key={container.id} className="container-row">
                <span className="row-number">{index + 1}</span>

                <input
                  value={container.uniqueId}
                  className="input-field bg-gray-50"
                  readOnly
                />

                <div className="floating-input">
                  <input
                    type="text"
                    required
                    onChange={(e) =>
                      updateContainer(
                        container.id,
                        "containerNumber",
                        e.target.value,
                      )
                    }
                  />
                  <label>Container #</label>
                </div>

                <div className="floating-input">
                  <input
                    type="text"
                    required
                    onChange={(e) =>
                      updateContainer(container.id, "seal1", e.target.value)
                    }
                  />
                  <label>Seal Number 1</label>
                </div>

                <div className="floating-input">
                  <input
                    type="text"
                    onChange={(e) =>
                      updateContainer(container.id, "seal2", e.target.value)
                    }
                  />
                  <label>Seal Number 2</label>
                </div>

                <div className="floating-input">
                  <input
                    type="number"
                    required
                    onChange={(e) =>
                      updateContainer(
                        container.id,
                        "grossWeight",
                        e.target.value,
                      )
                    }
                  />
                  <label>Gross Weight</label>
                </div>

                <div className="floating-input">
                  <input
                    type="number"
                    required
                    onChange={(e) =>
                      updateContainer(container.id, "netWeight", e.target.value)
                    }
                  />
                  <label>Net Weight</label>
                </div>

                <div className="floating-input">
                  <input
                    type="number"
                    required
                    onChange={(e) =>
                      updateContainer(container.id, "noOfBags", e.target.value)
                    }
                  />
                  <label>No. of Bags</label>
                </div>

                {containers.length > 1 && (
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => removeContainerRow(container.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* =========================
          SHIPMENT DETAILS
      ========================== */}
          <div className="form-section">
            <h3>Shipment Details (Auto Calculated)</h3>

            <div className="form-grid">
              <div className="floating-input">
                <input
                  type="text"
                  required
                  onChange={(e) =>
                    setShipmentData({
                      ...shipmentData,
                      invoiceNumber: e.target.value,
                    })
                  }
                />
                <label>Invoice Number</label>
              </div>

              <div className="floating-input">
                <input
                  type="text"
                  required
                  onChange={(e) =>
                    setShipmentData({
                      ...shipmentData,
                      blNumber: e.target.value,
                    })
                  }
                />
                <label>BL Number</label>
              </div>

              <div className="floating-input">
                <input
                  type="text"
                  required
                  onChange={(e) =>
                    setShipmentData({
                      ...shipmentData,
                      arrivalPort: e.target.value,
                    })
                  }
                />
                <label>Port</label>
              </div>

              {/* Goods Dropdown */}
              <select
                className="select-field"
                value={shipmentData.goodsName || ""}
                onChange={(e) =>
                  setShipmentData({
                    ...shipmentData,
                    goodsName: e.target.value,
                  })
                }
              >
                <option value="">Select Goods</option>

                <option value="Rice 5% KOLKATA">Rice 5% KOLKATA</option>
<option value="Rice 15% KOLKATA">Rice 15% KOLKATA</option>
<option value="Rice 100% KOLKATA">Rice 100% KOLKATA</option>
<option value="Rice Reject KOLKATA">Rice Reject KOLKATA</option>

<option value="Rice 5% CHENNAI">Rice 5% CHENNAI</option>
<option value="Rice 15% CHENNAI">Rice 15% CHENNAL</option>
<option value="Rice 100% CHENNAI">Rice 100% CHENNAI</option>

<option value="DORB GRADE 1 INDIA">DORB GRADE 1 INDIA</option>
<option value="DORB GRADE 2 INDIA">DORB GRADE 2 INDIA</option>
<option value="DORB NIGERIA">DORB NIGERIA</option>

<option value="DDGS INDIA">DDGS INDIA</option>
<option value="DDGS USA">DDGS USA</option>

              </select>

              {/* Shipping Line Dropdown */}
              <select
                className="select-field"
                value={shipmentData.shippingLine || ""}
                onChange={(e) =>
                  setShipmentData({
                    ...shipmentData,
                    shippingLine: e.target.value,
                  })
                }
              >
                <option value="">Select Shipping Line</option>
                <option value="RLC">RLC</option>
                <option value="ONE">ONE</option>
                <option value="COSCO">COSCO</option>
                <option value="SAMUDERA">SAMUDERA</option>
                <option value="OOCL">OOCL</option>
                <option value="MAERSK">MAERSK</option>
                <option value="ASY AD">ASY AD</option>
                <option value="CORDELIA">CORDELIA</option>
                <option value="EVERGREEN">EVERGREEN</option>
                <option value="GOLD START LINE">GOLD START LINE</option>
              </select>


              {/* <label>Total Gross Weight</label> */}
              <div className="floating-input">
                <span className="title-input">Gross Weight</span>
                <input value={shipmentData.grossWeight} readOnly required />
              </div>

              <div className="floating-input">
                <span className="title-input">Net Weight</span>
                <input value={shipmentData.netWeight} readOnly required />
                {/* <label>Total Net Weight</label> */}
              </div>

              <div className="floating-input">
                <span className="title-input">No. of Bags</span>
                <input value={shipmentData.noOfBags} readOnly required />
              </div>

              <div className="floating-input">
                <input
                  type="number"
                  required
                  value={shipmentData.pricePerKgUsd}
                  onChange={(e) =>
                    setShipmentData({
                      ...shipmentData,
                      pricePerKgUsd: e.target.value,
                    })
                  }
                />
                <label>Price / KG ($)</label>
              </div>

              <div className="floating-input">
                <input
                  type="date"
                  required
                  onChange={(e) =>
                    setShipmentData({ ...shipmentData, eta: e.target.value })
                  }
                />
                <label>ETA</label>
              </div>

              <div className="floating-input">
                <input
                  type="number"
                  required
                  value={shipmentData.exchangeRate}
                  onChange={(e) =>
                    setShipmentData({
                      ...shipmentData,
                      exchangeRate: e.target.value,
                    })
                  }
                />
                <label>Exchange Rate</label>
              </div>
            </div>

            <div className="calculation-box">
              <Calculator size={18} />
              <strong>Total Value (VND):</strong>
              <span>{totalValueVnd.toLocaleString()} ₫</span>
            </div>
          </div>
        </div>

        {/* SECTION B: MULTIPLE CONTAINERS (+) */}

        <button type="submit" className="submit-btn mt-6">
          Submit Shipment & {containers.length} Containers
        </button>
      </form>
    </div>
  );
}
