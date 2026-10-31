import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchMandiPrices,
  updateMandiPrice,
  predictAIMandiPrice,
  predictAllAIMandiPrices,
} from '../../services/adminApi';

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const COMMODITY_PRESETS = [
  { key: 'soybean', name: 'Soybean (सोयाबीन)', defaultMarket: 'Latur APMC', unit: '₹ / Quintal' },
  { key: 'wheat', name: 'Wheat (गहू)', defaultMarket: 'Pune APMC', unit: '₹ / Quintal' },
  { key: 'sugarcane', name: 'Sugarcane (ऊस)', defaultMarket: 'Kolhapur APMC', unit: '₹ / Quintal (₹3350/Tonne)' },
  { key: 'cotton', name: 'Cotton (कापूस)', defaultMarket: 'Nagpur APMC', unit: '₹ / Quintal' },
  { key: 'rice', name: 'Rice / Paddy (भात)', defaultMarket: 'Nashik APMC', unit: '₹ / Quintal' },
  { key: 'maize', name: 'Maize / Corn (मका)', defaultMarket: 'Sangli APMC', unit: '₹ / Quintal' },
  { key: 'onion', name: 'Onion (कांदा)', defaultMarket: 'Lasalgaon APMC', unit: '₹ / Quintal' },
  { key: 'potato', name: 'Potato (बटाटा)', defaultMarket: 'Manchar APMC', unit: '₹ / Quintal' },
  { key: 'tomato', name: 'Tomato (टोमॅटो)', defaultMarket: 'Narayangaon APMC', unit: '₹ / Quintal' },
  { key: 'groundnut', name: 'Groundnut (भुईमूग)', defaultMarket: 'Dhule APMC', unit: '₹ / Quintal' },
  { key: 'mustard', name: 'Mustard (मोहरी)', defaultMarket: 'Jalgaon APMC', unit: '₹ / Quintal' },
  { key: 'tur', name: 'Tur / Pigeon Pea (तूर)', defaultMarket: 'Akola APMC', unit: '₹ / Quintal' },
];

export default function AdminMandiPricesPage() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forecastingAll, setForecastingAll] = useState(false);
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState(null); // { item, isNew }
  const [toast, setToast] = useState(null);
  const [reforecastingKey, setReforecastingKey] = useState(null);
  const [expandedReason, setExpandedReason] = useState(null);

  const loadPrices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMandiPrices();
      setPrices(data);
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  }

  // 1-Click AI Forecast for ALL Commodities
  async function handleRunAllAIForecasts() {
    setForecastingAll(true);
    try {
      const res = await predictAllAIMandiPrices();
      showToast(
        res.message || '🤖 AI successfully forecasted and updated all mandi commodity benchmark rates!',
        'success'
      );
      await loadPrices();
    } catch (err) {
      showToast(`AI Forecasting failed: ${err.message}`, 'danger');
    } finally {
      setForecastingAll(false);
    }
  }

  // Quick 1-Click AI Re-forecast for a single row
  async function handleQuickRowAIForecast(item) {
    setReforecastingKey(item.crop_key);
    try {
      const res = await predictAIMandiPrice(item.crop_key, item.market_name, item.state);
      const forecast = res.forecast;
      if (forecast) {
        await updateMandiPrice({
          crop_key: forecast.crop_key,
          crop_name: forecast.crop_name,
          market_name: forecast.market_name,
          state: forecast.state,
          min_price: forecast.min_price,
          max_price: forecast.max_price,
          modal_price: forecast.modal_price,
          unit: forecast.unit,
        });
        showToast(`🤖 AI Re-forecast applied for ${item.crop_name}: ${fmtINR(forecast.modal_price)}`, 'success');
        await loadPrices();
      }
    } catch (err) {
      showToast(`AI forecast error: ${err.message}`, 'danger');
    } finally {
      setReforecastingKey(null);
    }
  }

  const filtered = prices.filter(
    (p) =>
      p.crop_name.toLowerCase().includes(search.toLowerCase()) ||
      p.market_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.state || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`alert alert-${toast.type} position-fixed top-0 end-0 m-3 shadow-lg py-2 px-3`}
          style={{ zIndex: 9999, minWidth: 320, borderRadius: 10 }}
        >
          <div className="d-flex align-items-center gap-2">
            <i className={`bi bi-${toast.type === 'success' ? 'robot' : 'exclamation-circle-fill'} fs-5`}></i>
            <div className="small fw-semibold">{toast.msg}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
            <i className="bi bi-shop-window text-success"></i>
            <span>Mandi APMC Market Prices (AI Forecasted)</span>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-6 fw-normal">
              <i className="bi bi-cpu-fill me-1"></i>AI Automated
            </span>
          </h4>
          <small className="text-muted">
            The admin does not give manual prices. Rates are calculated by AI price forecasting models using APMC arrivals, demand trends, and seasonal benchmarks.
          </small>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
            onClick={loadPrices}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh</span>
          </button>

          {/* 1-Click AI Forecast All */}
          <button
            className="btn btn-primary btn-sm d-flex align-items-center gap-2 shadow-sm fw-semibold"
            onClick={handleRunAllAIForecasts}
            disabled={forecastingAll}
            title="Runs machine learning price forecasting across all crops and mandis"
          >
            {forecastingAll ? (
              <>
                <span className="spinner-border spinner-border-sm"></span>
                <span>AI Forecasting All...</span>
              </>
            ) : (
              <>
                <i className="bi bi-robot"></i>
                <span>🤖 Run AI Price Forecast For All Crops</span>
              </>
            )}
          </button>

          {/* Add / Forecast Specific Crop */}
          <button
            className="btn btn-success btn-sm d-flex align-items-center gap-1 fw-semibold shadow-sm"
            onClick={() => setActiveModal({ isNew: true })}
          >
            <i className="bi bi-plus-circle me-1"></i>
            <span>Generate AI Rate for Crop</span>
          </button>
        </div>
      </div>

      {/* AI Intelligence Explanatory Banner */}
      <div className="alert alert-info border-0 shadow-sm d-flex align-items-center justify-content-between py-2 px-3 mb-4">
        <div className="d-flex align-items-center gap-2 small">
          <i className="bi bi-info-circle-fill text-info fs-5"></i>
          <span>
            <strong>Zero Manual Pricing:</strong> In this system, admins do not input manual commodity figures. Every rate is generated by our AI Market Intelligence Engine calibrated to Maharashtra APMC mandis.
          </span>
        </div>
        <span className="badge bg-white text-info border border-info-subtle small text-nowrap">
          <i className="bi bi-lightning-charge-fill me-1 text-warning"></i>Real-time AI Synced
        </span>
      </div>

      {/* Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 h-100">
            <div className="text-muted small">Tracked Commodities</div>
            <div className="fw-bold fs-3 text-dark">{prices.length}</div>
            <small className="text-muted">APMC regulated crops</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 h-100">
            <div className="text-muted small">Primary Market Hubs</div>
            <div className="fw-bold fs-3 text-primary">
              {new Set(prices.map((p) => p.market_name)).size}
            </div>
            <small className="text-muted">Active APMC mandis</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 h-100">
            <div className="text-muted small">Highest Modal Benchmark</div>
            <div className="fw-bold fs-3 text-success">
              {prices.length > 0 ? fmtINR(Math.max(...prices.map((p) => p.modal_price))) : '₹0'}
            </div>
            <small className="text-muted">Peak commodity price</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 h-100">
            <div className="text-muted small">Pricing Mode</div>
            <div className="fw-bold fs-3 text-success d-flex align-items-center gap-2">
              <i className="bi bi-cpu-fill text-primary fs-4"></i>
              <span>100% AI</span>
            </div>
            <small className="text-muted">AI Machine Learning Feed</small>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2 px-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span className="small text-muted fw-semibold">
            Showing {filtered.length} of {prices.length} AI-monitored APMC mandi rates
          </span>
          <div className="input-group" style={{ maxWidth: 300 }}>
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control form-control-sm border-start-0"
              placeholder="Search commodity or mandi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Rates Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success"></div>
              <div className="mt-2 text-muted small">Loading AI Mandi Intelligence...</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Commodity / Crop</th>
                    <th>APMC Market Hub</th>
                    <th>State</th>
                    <th className="text-end">AI Min Price</th>
                    <th className="text-end">AI Max Price</th>
                    <th className="text-end fw-bold">AI Modal Benchmark</th>
                    <th className="text-center">AI Market Trend</th>
                    <th className="text-center">AI Confidence</th>
                    <th className="text-center" style={{ width: 140 }}>
                      AI Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const isReforecasting = reforecastingKey === p.crop_key;
                    const isExpanded = expandedReason === p.crop_key;
                    return (
                      <React.Fragment key={p.crop_key}>
                        <tr>
                          <td>
                            <div className="fw-bold text-dark d-flex align-items-center gap-2">
                              <span>{p.crop_name}</span>
                              <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '9px' }}>
                                AI
                              </span>
                            </div>
                            <small className="text-muted font-monospace">{p.crop_key}</small>
                          </td>
                          <td>
                            <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                            {p.market_name}
                          </td>
                          <td className="text-muted">{p.state}</td>
                          <td className="text-end text-muted">{fmtINR(p.min_price)}</td>
                          <td className="text-end text-muted">{fmtINR(p.max_price)}</td>
                          <td className="text-end fw-bold text-success fs-6">
                            {fmtINR(p.modal_price)}
                            <div className="text-muted fw-normal" style={{ fontSize: '10px' }}>
                              {p.unit}
                            </div>
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge ${
                                (p.ai_trend || '').includes('Rising') || (p.ai_trend || '').includes('Bullish')
                                  ? 'bg-success-subtle text-success border border-success-subtle'
                                  : (p.ai_trend || '').includes('Falling') || (p.ai_trend || '').includes('Bearish')
                                  ? 'bg-danger-subtle text-danger border border-danger-subtle'
                                  : 'bg-primary-subtle text-primary border border-primary-subtle'
                              }`}
                              style={{ fontSize: '11px' }}
                            >
                              {(p.ai_trend || '').includes('Rising') || (p.ai_trend || '').includes('Bullish') ? (
                                <i className="bi bi-graph-up-arrow me-1"></i>
                              ) : (p.ai_trend || '').includes('Falling') ? (
                                <i className="bi bi-graph-down-arrow me-1"></i>
                              ) : (
                                <i className="bi bi-dash-lg me-1"></i>
                              )}
                              {p.ai_trend || 'Stable'}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">
                              {p.ai_confidence || 95}% Match
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex align-items-center justify-content-center gap-1">
                              {/* 1-Click AI Re-forecast Button */}
                              <button
                                className="btn btn-sm btn-outline-primary py-1 px-2 d-flex align-items-center gap-1"
                                onClick={() => handleQuickRowAIForecast(p)}
                                disabled={isReforecasting}
                                title="Run single AI price re-forecast for this crop"
                                style={{ fontSize: '11px' }}
                              >
                                {isReforecasting ? (
                                  <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }}></span>
                                ) : (
                                  <i className="bi bi-robot"></i>
                                )}
                                <span>AI Forecast</span>
                              </button>

                              {/* Toggle AI Reasoning */}
                              <button
                                className={`btn btn-sm ${isExpanded ? 'btn-info text-white' : 'btn-outline-secondary'} p-1`}
                                style={{ width: 28, height: 28 }}
                                onClick={() => setExpandedReason(isExpanded ? null : p.crop_key)}
                                title="View AI market reasoning"
                              >
                                <i className="bi bi-info-circle"></i>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Collapsible AI Reasoning row */}
                        {isExpanded && (
                          <tr className="bg-light">
                            <td colSpan="9" className="p-3">
                              <div className="card border-0 bg-white p-3 shadow-sm rounded-3">
                                <div className="d-flex align-items-start gap-2">
                                  <div className="bg-primary-subtle text-primary p-2 rounded-circle flex-shrink-0">
                                    <i className="bi bi-cpu-fill fs-5"></i>
                                  </div>
                                  <div className="flex-grow-1">
                                    <div className="fw-bold text-dark small mb-1">
                                      AI Market Intelligence Rationale for {p.crop_name} ({p.market_name})
                                    </div>
                                    <p className="text-muted small mb-2">
                                      {p.ai_reasoning ||
                                        'Price computed dynamically using baseline econometric models, state MSP parity, and seasonal APMC arrivals.'}
                                    </p>
                                    <div className="d-flex flex-wrap gap-3 small text-muted">
                                      <span><strong>Estimated Range:</strong> {fmtINR(p.min_price)} — {fmtINR(p.max_price)}</span>
                                      <span><strong>AI Modal Target:</strong> {fmtINR(p.modal_price)}</span>
                                      <span><strong>Confidence:</strong> {p.ai_confidence || 95}%</span>
                                    </div>
                                  </div>
                                  <button
                                    className="btn btn-sm btn-close"
                                    onClick={() => setExpandedReason(null)}
                                  ></button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* AI Price Generator Modal */}
      {activeModal && (
        <AIForecastModal
          onClose={() => setActiveModal(null)}
          onSuccess={(msg) => {
            showToast(msg);
            loadPrices();
          }}
        />
      )}
    </div>
  );
}

/**
 * AI Price Forecasting Modal
 * Admin chooses crop and market; AI computes the price! Admin NEVER types prices manually.
 */
function AIForecastModal({ onClose, onSuccess }) {
  const [selectedPreset, setSelectedPreset] = useState(COMMODITY_PRESETS[0].key);
  const [marketName, setMarketName] = useState(COMMODITY_PRESETS[0].defaultMarket);
  const [state, setState] = useState('Maharashtra');
  const [forecast, setForecast] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Auto-run AI forecast when modal opens or crop changes
  useEffect(() => {
    runAIPrediction(selectedPreset, marketName, state);
  }, [selectedPreset]);

  async function runAIPrediction(cropKey, market, st) {
    setPredicting(true);
    setError('');
    try {
      const res = await predictAIMandiPrice(cropKey, market, st);
      setForecast(res.forecast);
    } catch (err) {
      setError(err.message || 'Failed to generate AI price forecast.');
    } finally {
      setPredicting(false);
    }
  }

  function handleCropChange(e) {
    const key = e.target.value;
    setSelectedPreset(key);
    const found = COMMODITY_PRESETS.find((p) => p.key === key);
    if (found) {
      setMarketName(found.defaultMarket);
    }
  }

  async function handleApplyAIForecast(e) {
    e.preventDefault();
    if (!forecast) return;
    setSaving(true);
    setError('');
    try {
      await updateMandiPrice({
        crop_key: forecast.crop_key,
        crop_name: forecast.crop_name,
        market_name: marketName,
        state: state,
        min_price: forecast.min_price,
        max_price: forecast.max_price,
        modal_price: forecast.modal_price,
        unit: forecast.unit,
      });
      onSuccess(`🤖 AI Predicted price of ${fmtINR(forecast.modal_price)} successfully published for ${forecast.crop_name}!`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal d-block"
      style={{ background: 'rgba(0,0,0,0.55)', zIndex: 1050, position: 'fixed', inset: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 540 }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14, overflow: 'hidden' }}>
          <div className="modal-header bg-success text-white py-3">
            <h5 className="modal-title mb-0 d-flex align-items-center gap-2 fs-6">
              <i className="bi bi-robot"></i>
              <span>AI Commodity Price Forecast Generator</span>
            </h5>
            <button className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleApplyAIForecast}>
            <div className="modal-body p-4">
              <div className="alert alert-light border small text-muted mb-3 py-2">
                <i className="bi bi-shield-check text-success me-1"></i>
                <strong>Automated AI Pricing:</strong> Select the commodity and market. Our AI forecasting engine evaluates seasonal yield, APMC arrivals, and inflation indices to output calibrated modal prices.
              </div>

              {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-semibold">Select Commodity / Crop *</label>
                  <select
                    className="form-select form-select-sm"
                    value={selectedPreset}
                    onChange={handleCropChange}
                  >
                    {COMMODITY_PRESETS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-7">
                  <label className="form-label small fw-semibold">APMC Market Center</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={marketName}
                    onChange={(e) => setMarketName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-5">
                  <label className="form-label small fw-semibold">State</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* AI Forecast Result Box */}
              <div className="mt-4 pt-3 border-top">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="fw-semibold small text-dark d-flex align-items-center gap-1">
                    <i className="bi bi-cpu-fill text-primary"></i>
                    <span>AI Predicted Market Intelligence</span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm py-0 px-2 fw-semibold"
                    style={{ fontSize: '11px' }}
                    onClick={() => runAIPrediction(selectedPreset, marketName, state)}
                    disabled={predicting}
                  >
                    {predicting ? 'Forecasting...' : '⚡ Re-run AI Engine'}
                  </button>
                </div>

                {predicting ? (
                  <div className="p-4 text-center bg-light rounded-3">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    <span className="small text-muted">Querying AI Market Intelligence Model...</span>
                  </div>
                ) : forecast ? (
                  <div className="card bg-success bg-opacity-10 border-success border-opacity-25 p-3 rounded-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div>
                        <div className="text-muted small" style={{ fontSize: '11px' }}>AI Modal Benchmark Rate</div>
                        <div className="fw-bold fs-3 text-success">{fmtINR(forecast.modal_price)}</div>
                        <small className="text-muted">{forecast.unit}</small>
                      </div>
                      <div className="text-end">
                        <span className="badge bg-success mb-1">
                          {forecast.ai_confidence || 95}% AI Confidence
                        </span>
                        <div className="small text-muted fw-semibold">
                          Trend: <span className="text-success">{forecast.ai_trend || 'Bullish'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between small text-muted border-top border-secondary border-opacity-10 pt-2 mb-2">
                      <span><strong>AI Min Price:</strong> {fmtINR(forecast.min_price)}</span>
                      <span><strong>AI Max Price:</strong> {fmtINR(forecast.max_price)}</span>
                    </div>

                    <div className="small text-dark bg-white p-2 rounded border border-success-subtle" style={{ fontSize: '11.5px' }}>
                      <i className="bi bi-robot text-success me-1"></i>
                      <strong>AI Rationale:</strong> {forecast.ai_reasoning}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="modal-footer bg-light py-2">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-success btn-sm fw-semibold shadow-sm"
                disabled={saving || predicting || !forecast}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    <span>Applying AI Price...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle-fill me-1"></i>
                    <span>Apply AI Predicted Rate</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
