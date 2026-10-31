import React, { useState, useEffect } from 'react';
import {
  getCrops,
  getProfitPredictions,
  submitProfitPrediction,
  getCropFieldIntelligence,
} from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function AIProfitPredPage() {
  const { t } = useLanguage();

  const [crops, setCrops] = useState([]);
  const [history, setHistory] = useState([]);
  const [fieldInfo, setFieldInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    crop: '',
    predicted_yield: '',
    estimated_selling_price: '',
    estimated_cost: '',
    predicted_profit: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setInitialLoading(true);
    try {
      const [cropData, histData] = await Promise.all([
        getCrops(),
        getProfitPredictions(),
      ]);
      setCrops(cropData);
      setHistory(histData || []);

      if (cropData && cropData.length > 0) {
        const firstCropId = cropData[0].id;
        setForm((p) => ({ ...p, crop: firstCropId }));
        await loadCropDetails(firstCropId);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setInitialLoading(false);
    }
  }

  async function loadCropDetails(cropId) {
    if (!cropId) return;
    try {
      const intel = await getCropFieldIntelligence(cropId);
      setFieldInfo(intel);

      // Default values: default yield, selling price, and real recorded expenses
      const defaultYield = intel.estimated_yield || 20;
      const defaultPrice = intel.current_market_price || 2500;
      const defaultCost = intel.recorded_expense > 0 ? intel.recorded_expense : (intel.suggested_cost || 20000);
      const profit = (defaultYield * defaultPrice) - defaultCost;

      setForm((prev) => ({
        ...prev,
        crop: cropId,
        predicted_yield: defaultYield,
        estimated_selling_price: defaultPrice,
        estimated_cost: defaultCost,
        predicted_profit: profit.toFixed(2),
      }));

      // Automatically show initial calculation
      setResult({
        crop_id: cropId,
        crop_name: intel.crop_name,
        predicted_yield: defaultYield,
        estimated_selling_price: defaultPrice,
        estimated_cost: defaultCost,
        predicted_profit: profit,
        land_area: intel.land_area || 1,
      });
    } catch (err) {
      console.warn('Crop details load error:', err);
    }
  }

  async function handleCropChange(e) {
    const selectedId = e.target.value;
    setForm((p) => ({ ...p, crop: selectedId }));
    await loadCropDetails(selectedId);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };

    // Simple math: Profit = (Yield * Price) - Expenses
    const y = parseFloat(updated.predicted_yield) || 0;
    const p = parseFloat(updated.estimated_selling_price) || 0;
    const c = parseFloat(updated.estimated_cost) || 0;
    const profit = (y * p) - c;
    updated.predicted_profit = profit.toFixed(2);

    setForm(updated);

    // Live update result display
    if (result) {
      setResult((prev) => ({
        ...prev,
        predicted_yield: y,
        estimated_selling_price: p,
        estimated_cost: c,
        predicted_profit: profit,
      }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.crop || form.predicted_yield === '' || form.estimated_selling_price === '' || form.estimated_cost === '') {
      setError('Please enter yield, selling price, and total expenses.');
      return;
    }

    setLoading(true);
    setError('');

    const y = parseFloat(form.predicted_yield) || 0;
    const p = parseFloat(form.estimated_selling_price) || 0;
    const c = parseFloat(form.estimated_cost) || 0;
    const calculatedProfit = (y * p) - c;

    try {
      const payload = {
        crop: parseInt(form.crop),
        predicted_yield: y,
        estimated_selling_price: p,
        estimated_cost: c,
        predicted_profit: calculatedProfit,
      };

      const res = await submitProfitPrediction(payload);
      setResult({
        ...res.prediction,
        land_area: fieldInfo?.land_area || 1,
      });
      const histData = await getProfitPredictions();
      setHistory(histData || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const yieldVal = parseFloat(form.predicted_yield) || 0;
  const priceVal = parseFloat(form.estimated_selling_price) || 0;
  const costVal = parseFloat(form.estimated_cost) || 0;
  const liveRevenue = yieldVal * priceVal;
  const liveNetProfit = liveRevenue - costVal;
  const acres = fieldInfo?.land_area ? parseFloat(fieldInfo.land_area) : 1;
  const profitPerAcre = acres > 0 ? liveNetProfit / acres : liveNetProfit;

  const selectedCrop = crops.find((c) => c.id === parseInt(form.crop));

  return (
    <div className="container-fluid py-4">
      {/* Simple Clean Header */}
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
          <i className="bi bi-calculator text-success fs-3"></i>
          <span>Crop Profit Calculator</span>
        </h2>
        <p className="text-muted mb-0 small">
          Simple calculator: enter your expected yield, selling price, and expenses to calculate your net profit.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {initialLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
          <p className="mt-2 text-muted small">Loading calculator...</p>
        </div>
      ) : crops.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
          <i className="bi bi-flower2 fs-1 text-muted mb-3"></i>
          <h4>No crops registered yet</h4>
          <p className="text-muted">Register a crop first to calculate your profit.</p>
          <a href="/crops" className="btn btn-success px-4 mx-auto" style={{ maxWidth: 200 }}>
            <i className="bi bi-plus-lg me-1"></i> Add Crop
          </a>
        </div>
      ) : (
        <div className="row g-4">
          {/* Left Column: Simple Inputs */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-white border-bottom py-3">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-pencil-square text-success"></i>
                  <span>Enter Crop Details</span>
                </h6>
              </div>

              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  {/* Crop Selection */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Select Crop *</label>
                    <select
                      name="crop"
                      value={form.crop}
                      onChange={handleCropChange}
                      className="form-select border-success"
                      required
                    >
                      {crops.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.crop_name} {c.variety ? `(${c.variety})` : ''} — {c.field_name}
                        </option>
                      ))}
                    </select>
                    {fieldInfo && (
                      <small className="text-muted mt-1 d-block">
                        Field Area: <strong>{fieldInfo.land_area} Acres</strong> ({fieldInfo.field_name})
                      </small>
                    )}
                  </div>

                  {/* Expected Yield */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Expected Harvest Yield *</label>
                    <div className="input-group">
                      <input
                        type="number"
                        name="predicted_yield"
                        value={form.predicted_yield}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. 40"
                        min="0"
                        step="0.1"
                        required
                      />
                      <span className="input-group-text bg-light fw-semibold">Quintals</span>
                    </div>
                    <small className="text-muted">Total harvest you expect to produce.</small>
                  </div>

                  {/* Selling Price */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Selling Price per Quintal *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light fw-semibold">₹</span>
                      <input
                        type="number"
                        name="estimated_selling_price"
                        value={form.estimated_selling_price}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. 2500"
                        min="0"
                        step="10"
                        required
                      />
                      <span className="input-group-text bg-light">/ Quintal</span>
                    </div>
                    <small className="text-muted">Expected selling price per quintal.</small>
                  </div>

                  {/* Total Expenses */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-semibold small mb-0">Total Expenses / Cost *</label>
                      {fieldInfo && fieldInfo.recorded_expense > 0 && (
                        <span className="badge bg-success-subtle text-success border small">
                          {fmtINR(fieldInfo.recorded_expense)} recorded in Expenses
                        </span>
                      )}
                    </div>
                    <div className="input-group">
                      <span className="input-group-text bg-light fw-semibold">₹</span>
                      <input
                        type="number"
                        name="estimated_cost"
                        value={form.estimated_cost}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. 20000"
                        min="0"
                        step="50"
                        required
                      />
                    </div>
                    <small className="text-muted">
                      Total cost spent on seeds, fertilizers, tractor, labor, and water.
                    </small>
                  </div>

                  {/* Live Formula Preview Box */}
                  <div className="p-3 bg-light rounded-3 border mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-1 small">
                      <span className="text-muted">Total Revenue ({yieldVal} Qtl × {fmtINR(priceVal)}):</span>
                      <strong className="text-primary">{fmtINR(liveRevenue)}</strong>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2 small">
                      <span className="text-muted">Minus Total Expenses:</span>
                      <strong className="text-danger">− {fmtINR(costVal)}</strong>
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="fw-bold text-dark">Calculated Net Profit:</span>
                      <span className={`fw-bold fs-5 ${liveNetProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                        {liveNetProfit >= 0 ? '+' : ''}{fmtINR(liveNetProfit)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success w-100 py-2 fw-semibold shadow-sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving Calculation...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2-circle me-1"></i>
                        Save Calculation to History
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column: Clean, Simple Results & History */}
          <div className="col-lg-7">
            {/* Main Result Card */}
            <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
              <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                <h6 className="fw-bold text-dark mb-0">
                  <i className="bi bi-graph-up text-success me-2"></i>
                  Profit Summary
                </h6>
                <span className={`badge ${liveNetProfit >= 0 ? 'bg-success' : 'bg-danger'}`}>
                  {liveNetProfit >= 0 ? 'Profitable' : 'Loss'}
                </span>
              </div>

              <div className="card-body p-4 text-center">
                <small className="text-muted text-uppercase fw-semibold d-block mb-1">
                  Net Profit
                </small>
                <h1 className={`display-4 fw-bold ${liveNetProfit >= 0 ? 'text-success' : 'text-danger'} mb-2`}>
                  {liveNetProfit >= 0 ? '+' : ''}{fmtINR(liveNetProfit)}
                </h1>

                {acres > 0 && (
                  <div className="text-muted small mb-4">
                    Net Return per Acre: <strong className={liveNetProfit >= 0 ? 'text-success' : 'text-danger'}>
                      {liveNetProfit >= 0 ? '+' : ''}{fmtINR(profitPerAcre)} / Acre
                    </strong> ({acres} Acres)
                  </div>
                )}

                {/* 3 Clean Metric Cards */}
                <div className="row g-3">
                  <div className="col-4">
                    <div className="p-3 bg-primary-subtle rounded-3 text-center h-100">
                      <small className="text-muted d-block mb-1">Total Revenue</small>
                      <strong className="text-primary fs-5">{fmtINR(liveRevenue)}</strong>
                      <div className="text-muted small" style={{ fontSize: '11px' }}>
                        {yieldVal} Qtl × {fmtINR(priceVal)}
                      </div>
                    </div>
                  </div>

                  <div className="col-4">
                    <div className="p-3 bg-danger-subtle rounded-3 text-center h-100">
                      <small className="text-muted d-block mb-1">Total Expenses</small>
                      <strong className="text-danger fs-5">{fmtINR(costVal)}</strong>
                      <div className="text-muted small" style={{ fontSize: '11px' }}>
                        Seeds, Labor &amp; Inputs
                      </div>
                    </div>
                  </div>

                  <div className="col-4">
                    <div className={`p-3 rounded-3 text-center h-100 ${liveNetProfit >= 0 ? 'bg-success-subtle' : 'bg-danger-subtle'}`}>
                      <small className="text-muted d-block mb-1">Net Margin</small>
                      <strong className={`${liveNetProfit >= 0 ? 'text-success' : 'text-danger'} fs-5`}>
                        {liveNetProfit >= 0 ? '+' : ''}{fmtINR(liveNetProfit)}
                      </strong>
                      <div className="text-muted small" style={{ fontSize: '11px' }}>
                        Revenue − Expenses
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simple explanation */}
                <div className={`alert ${liveNetProfit >= 0 ? 'alert-success' : 'alert-warning'} mt-4 mb-0 text-start small`}>
                  <i className="bi bi-info-circle-fill me-2"></i>
                  {liveNetProfit >= 0 ? (
                    <span>
                      Selling <strong>{yieldVal} Quintals</strong> at <strong>{fmtINR(priceVal)}/Qtl</strong> gives a total revenue of <strong>{fmtINR(liveRevenue)}</strong>. After deducting your expenses of <strong>{fmtINR(costVal)}</strong>, your clean profit is <strong>{fmtINR(liveNetProfit)}</strong>.
                    </span>
                  ) : (
                    <span>
                      Your cultivation expenses (<strong>{fmtINR(costVal)}</strong>) are higher than your revenue (<strong>{fmtINR(liveRevenue)}</strong>). You would need a selling price of at least <strong>{yieldVal > 0 ? fmtINR(costVal / yieldVal) : '₹0'}/Qtl</strong> to cover expenses.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Past Calculations History */}
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                <h6 className="fw-bold text-dark mb-0">
                  <i className="bi bi-clock-history me-2 text-secondary"></i>
                  Saved Calculations History
                </h6>
                <span className="badge bg-light text-muted border">{history.length} records</span>
              </div>

              <div className="card-body p-0">
                {history.length === 0 ? (
                  <div className="text-center py-4 text-muted small">
                    No calculations saved yet. Click "Save Calculation to History" to keep a record.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 small">
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Crop</th>
                          <th className="text-end">Yield</th>
                          <th className="text-end">Price / Qtl</th>
                          <th className="text-end">Expenses</th>
                          <th className="text-end">Net Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h) => (
                          <tr key={h.id}>
                            <td className="text-muted">
                              {h.prediction_date
                                ? new Date(h.prediction_date).toLocaleDateString('en-IN')
                                : '—'}
                            </td>
                            <td className="fw-semibold text-dark">{h.crop_name}</td>
                            <td className="text-end">{h.predicted_yield} Qtl</td>
                            <td className="text-end">{fmtINR(h.estimated_selling_price)}</td>
                            <td className="text-end text-danger">{fmtINR(h.estimated_cost)}</td>
                            <td className={`text-end fw-bold ${Number(h.predicted_profit) >= 0 ? 'text-success' : 'text-danger'}`}>
                              {Number(h.predicted_profit) >= 0 ? '+' : ''}{fmtINR(h.predicted_profit)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
