import React, { useState, useEffect } from 'react';
import { getCrops, getProfitPredictions, submitProfitPrediction, getCropFieldIntelligence, getMarketPrices } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function AIProfitPredPage() {
  const { t } = useLanguage();

  const [crops, setCrops] = useState([]);
  const [history, setHistory] = useState([]);
  const [marketPrices, setMarketPrices] = useState([]);
  const [fieldIntel, setFieldIntel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [intelLoading, setIntelLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    crop: '',
    estimated_cost: '',
    predicted_yield: '',
    estimated_selling_price: '',
    predicted_profit: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setInitialLoading(true);
    try {
      const [cropData, histData, marketData] = await Promise.all([
        getCrops(),
        getProfitPredictions(),
        getMarketPrices().catch(() => []),
      ]);
      setCrops(cropData);
      setHistory(histData);
      setMarketPrices(marketData || []);

      if (cropData.length > 0) {
        const firstCropId = cropData[0].id;
        setForm((p) => ({ ...p, crop: firstCropId }));
        await fetchCropFieldIntel(firstCropId);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setInitialLoading(false);
    }
  }

  async function fetchCropFieldIntel(cropId) {
    if (!cropId) return;
    setIntelLoading(true);
    try {
      const intel = await getCropFieldIntelligence(cropId);
      setFieldIntel(intel);
      // Auto-populate form with field intelligence and real market price
      const sellingPrice = intel.current_market_price || 3500;
      const expectedYield = intel.estimated_yield || 15;
      const cost = intel.suggested_cost || (intel.recorded_expense > 0 ? intel.recorded_expense : 30000);

      const profit = (expectedYield * sellingPrice) - cost;

      setForm((prev) => ({
        ...prev,
        crop: cropId,
        estimated_cost: cost,
        predicted_yield: expectedYield,
        estimated_selling_price: sellingPrice,
        predicted_profit: profit.toFixed(2),
      }));
    } catch (err) {
      console.warn('Field intelligence note:', err);
    } finally {
      setIntelLoading(false);
    }
  }

  async function handleCropChange(e) {
    const selectedId = e.target.value;
    setForm((p) => ({ ...p, crop: selectedId }));
    await fetchCropFieldIntel(selectedId);
  }

  function handleChange(e) {
    const updated = { ...form, [e.target.name]: e.target.value };
    // Live compute preview
    if (updated.predicted_yield && updated.estimated_selling_price && updated.estimated_cost) {
      const profit = (parseFloat(updated.predicted_yield) * parseFloat(updated.estimated_selling_price)) - parseFloat(updated.estimated_cost);
      updated.predicted_profit = isNaN(profit) ? '' : profit.toFixed(2);
    }
    setForm(updated);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.crop || !form.estimated_cost || !form.predicted_yield || !form.estimated_selling_price) {
      setError(t('profitPrediction.fillAllFields'));
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const payload = {
        crop: parseInt(form.crop),
        estimated_cost: parseFloat(form.estimated_cost),
        predicted_yield: parseFloat(form.predicted_yield),
        estimated_selling_price: parseFloat(form.estimated_selling_price),
        predicted_profit: parseFloat(form.predicted_profit) || 0,
      };

      const res = await submitProfitPrediction(payload);
      setResult(res.prediction);
      const histData = await getProfitPredictions();
      setHistory(histData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const computedProfit = form.predicted_yield && form.estimated_selling_price && form.estimated_cost
    ? (parseFloat(form.predicted_yield) * parseFloat(form.estimated_selling_price)) - parseFloat(form.estimated_cost)
    : null;

  const selectedCrop = crops.find((c) => c.id === parseInt(form.crop));

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">
            <i className="bi bi-graph-up-arrow text-success me-2"></i>
            {t('aiProfitPredTitle')}
          </h2>
          <p className="text-muted mb-0 small">
            {t('profitPrediction.subtitle')}
          </p>
        </div>
        <span className="badge bg-success-subtle text-success border border-success px-3 py-2">
          <i className="bi bi-broadcast me-1"></i>
          {t('profitPrediction.liveRatesActive')}
        </span>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
          <button className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {initialLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
          <p className="mt-2 text-muted">{t('loading')}</p>
        </div>
      ) : crops.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
          <i className="bi bi-flower2 fs-1 text-muted mb-3"></i>
          <h4>{t('profitPrediction.noCropsFound')}</h4>
          <p className="text-muted">
            {t('profitPrediction.registerCropFirst')}
          </p>
          <a href="/crops" className="btn btn-success px-4 mx-auto" style={{ maxWidth: 200 }}>
            <i className="bi bi-plus-lg me-1"></i>
            {t('profitPrediction.addCrop')}
          </a>
        </div>
      ) : (
        <div className="row g-4">
          {/* Left Column: Form & Field Intelligence */}
          <div className="col-lg-5">
            {/* Field Intelligence Card */}
            {fieldIntel && (
              <div className="card border-0 shadow-sm rounded-4 bg-white mb-3 border-start border-4 border-success">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-success-subtle text-success fw-bold">
                      <i className="bi bi-geo-alt-fill me-1"></i>
                      {t('profitPrediction.fieldIntelligenceData')}
                    </span>
                    {intelLoading && <span className="spinner-border spinner-border-sm text-success"></span>}
                  </div>
                  <div className="row g-2 small">
                    <div className="col-6">
                      <span className="text-muted d-block">{t('profitPrediction.fieldArea')}</span>
                      <strong>{fieldIntel.field_name || 'Plot 1'} ({fieldIntel.land_area} {t('acres')})</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">{t('profitPrediction.recordedExpenses')}</span>
                      <strong className="text-danger">₹{fieldIntel.recorded_expense.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">{t('profitPrediction.currentApmcPrice')}</span>
                      <strong className="text-primary">₹{fieldIntel.current_market_price.toLocaleString('en-IN')} / Qtl</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">{t('profitPrediction.mandiMarket')}</span>
                      <strong className="text-dark">{fieldIntel.market_name}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="card border-0 shadow-sm rounded-4 bg-white h-auto">
              <div className="card-header bg-white border-bottom py-3">
                <h6 className="fw-bold text-dark mb-0">
                  <i className="bi bi-calculator me-2 text-success"></i>
                  {t('profitPrediction.selectCropAndForecast')}
                </h6>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  {/* Crop selection */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">{t('profitPrediction.selectCropFromFields')}</label>
                    <select
                      name="crop"
                      value={form.crop}
                      onChange={handleCropChange}
                      className="form-select border-success"
                      required
                    >
                      {crops.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.crop_name} {c.variety ? `(${c.variety})` : ''} — {c.field_name} ({c.season})
                        </option>
                      ))}
                    </select>
                    {selectedCrop && (
                      <small className="text-muted mt-1 d-block">
                        {t('profitPrediction.sownDate')} <strong>{selectedCrop.sowing_date}</strong>
                      </small>
                    )}
                  </div>

                  {/* Estimated Cost */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-semibold small mb-0">{t('estimatedCost')} *</label>
                      {fieldIntel && fieldIntel.recorded_expense > 0 && (
                        <span className="badge bg-light text-muted border small">
                          ₹{fieldIntel.recorded_expense.toLocaleString('en-IN')} {t('profitPrediction.recorded')}
                        </span>
                      )}
                    </div>
                    <div className="input-group">
                      <span className="input-group-text bg-light">₹</span>
                      <input
                        type="number"
                        name="estimated_cost"
                        value={form.estimated_cost}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. 45000"
                        min="0"
                        step="50"
                        required
                      />
                    </div>
                    <small className="text-muted">
                      {fieldIntel?.cost_source || t('profitPrediction.costInputsHint')}
                    </small>
                  </div>

                  {/* Expected Yield */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-semibold small mb-0">{t('profitPrediction.yieldQuintals')}</label>
                      {fieldIntel && (
                        <span className="badge bg-light text-muted border small">
                          {fieldIntel.estimated_yield} Qtl {t('profitPrediction.estimate')}
                        </span>
                      )}
                    </div>
                    <div className="input-group">
                      <input
                        type="number"
                        name="predicted_yield"
                        value={form.predicted_yield}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. 35"
                        min="0"
                        step="0.1"
                        required
                      />
                      <span className="input-group-text bg-light">Qtl</span>
                    </div>
                    <small className="text-muted">
                      {fieldIntel?.yield_source || t('profitPrediction.yieldHint')}
                    </small>
                  </div>

                  {/* Current Market Price per Quintal */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-semibold small mb-0">
                        {t('profitPrediction.currentMarketPrice')}
                      </label>
                      {fieldIntel && (
                        <span className="badge bg-primary-subtle text-primary border small">
                          {fieldIntel.market_name}
                        </span>
                      )}
                    </div>
                    <div className="input-group">
                      <span className="input-group-text bg-light">₹</span>
                      <input
                        type="number"
                        name="estimated_selling_price"
                        value={form.estimated_selling_price}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g. 3800"
                        min="0"
                        step="10"
                        required
                      />
                      <span className="input-group-text bg-light">/ Qtl</span>
                    </div>
                    <small className="text-muted">
                      {fieldIntel
                        ? `${t('profitPrediction.range')} ₹${fieldIntel.market_min_price} - ₹${fieldIntel.market_max_price} / Qtl`
                        : t('profitPrediction.mandiRateHint')}
                    </small>
                  </div>

                  {/* Live Profit Preview */}
                  {computedProfit !== null && (
                    <div className={`alert ${computedProfit >= 0 ? 'alert-success' : 'alert-danger'} py-3 mb-4`}>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-semibold">
                          {t('profitPrediction.projectedNetProfit')}
                        </span>
                        <span className="fw-bold fs-5">
                          {computedProfit >= 0 ? '+' : ''}₹{computedProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <small className="text-muted d-block mt-1">
                        (₹{Number(form.estimated_selling_price || 0).toLocaleString('en-IN')} × {form.predicted_yield || 0} Qtl) − ₹{Number(form.estimated_cost || 0).toLocaleString('en-IN')}
                      </small>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-success w-100 py-2 fw-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {t('profitPrediction.forecasting')}
                      </>
                    ) : (
                      <>
                        <i className="bi bi-graph-up-arrow me-2"></i>
                        {t('profitPrediction.forecastProfitBtn')}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column: Prediction Results & Market Rates Board */}
          <div className="col-lg-7">
            {result ? (
              <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
                <div
                  className={`card-header py-3 ${result.predicted_profit >= 0 ? 'bg-success-subtle' : 'bg-danger-subtle'}`}
                >
                  <span className={`badge float-end ${result.predicted_profit >= 0 ? 'bg-success' : 'bg-danger'}`}>
                    {result.predicted_profit >= 0
                      ? t('profitPrediction.profitableYield')
                      : t('profitPrediction.lossWarning')}
                  </span>
                  <h5 className="fw-bold mb-0 text-dark">
                    <i className="bi bi-pie-chart-fill me-2 text-success"></i>
                    {t('profitPrediction.forecastAnalysis')}
                  </h5>
                </div>
                <div className="card-body p-4">
                  {/* Big profit number */}
                  <div className="text-center py-3">
                    <small className="text-muted text-uppercase fw-semibold d-block mb-1">
                      {t('profitPrediction.projectedNetMargin')}
                    </small>
                    <h1 className={`display-4 fw-bold ${result.predicted_profit >= 0 ? 'text-success' : 'text-danger'} mb-1`}>
                      {result.predicted_profit >= 0 ? '+' : ''}₹{Number(result.predicted_profit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </h1>
                    {result.estimated_cost > 0 && (
                      <div className="text-muted small">
                        {t('common.roi', { percent: ((result.predicted_profit / result.estimated_cost) * 100).toFixed(1) })}
                      </div>
                    )}
                  </div>

                  <hr />

                  {/* Breakdown */}
                  <div className="row g-3">
                    <div className="col-sm-4">
                      <div className="p-3 bg-danger-subtle rounded-3 text-center">
                        <small className="text-muted d-block">{t('profitPrediction.totalInputCost')}</small>
                        <strong className="text-danger">₹{Number(result.estimated_cost).toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="p-3 bg-primary-subtle rounded-3 text-center">
                        <small className="text-muted d-block">{t('profitPrediction.estimatedRevenue')}</small>
                        <strong className="text-primary">
                          ₹{(result.predicted_yield * result.estimated_selling_price).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                        </strong>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className={`p-3 rounded-3 text-center ${result.predicted_profit >= 0 ? 'bg-success-subtle' : 'bg-danger-subtle'}`}>
                        <small className="text-muted d-block">{t('netProfit')}</small>
                        <strong className={result.predicted_profit >= 0 ? 'text-success' : 'text-danger'}>
                          {result.predicted_profit >= 0 ? '+' : ''}₹{Number(result.predicted_profit).toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="p-3 bg-light rounded-3">
                        <small className="text-muted d-block">{t('profitPrediction.expectedYield')}</small>
                        <strong>{result.predicted_yield} Qtl</strong>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="p-3 bg-light rounded-3">
                        <small className="text-muted d-block">{t('profitPrediction.apmcRate')}</small>
                        <strong>₹{Number(result.estimated_selling_price).toLocaleString('en-IN')} / Qtl</strong>
                      </div>
                    </div>
                  </div>

                  <div className={`alert ${result.predicted_profit >= 0 ? 'alert-success' : 'alert-warning'} mt-3 small mb-0`}>
                    <i className="bi bi-lightbulb-fill me-2"></i>
                    <strong>{t('profitPrediction.farmerAdvisory')}</strong>{' '}
                    {result.predicted_profit >= 0
                      ? t('profitPrediction.profitableAdvisory', { price: Number(result.estimated_selling_price).toLocaleString('en-IN') })
                      : t('profitPrediction.lossAdvisory')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card border-0 shadow-sm rounded-4 bg-white d-flex align-items-center justify-content-center p-5 text-center text-muted mb-4"
                style={{ minHeight: 220 }}>
                <i className="bi bi-currency-exchange fs-1 text-success opacity-50 mb-3"></i>
                <h5 className="fw-semibold text-dark">
                  {t('profitPrediction.readyToForecast')}
                </h5>
                <p className="small mb-0" style={{ maxWidth: '380px' }}>
                  {t('profitPrediction.readyToForecastHint')}
                </p>
              </div>
            )}

            {/* Live APMC Market Rates Board */}
            {marketPrices.length > 0 && (
              <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
                <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold text-dark mb-0">
                    <i className="bi bi-shop me-2 text-primary"></i>
                    {t('profitPrediction.mandiWholesalePrices')}
                  </h6>
                  <span className="badge bg-success-subtle text-success">
                    <i className="bi bi-check-circle-fill me-1"></i>
                    {t('profitPrediction.liveApmcFeed')}
                  </span>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 small">
                      <thead className="table-light">
                        <tr>
                          <th>{t('profitPrediction.grainCrop')}</th>
                          <th>{t('profitPrediction.market')}</th>
                          <th className="text-end">{t('profitPrediction.modalPrice')} (₹/Qtl)</th>
                          <th className="text-end">{t('profitPrediction.minPrice')} - {t('profitPrediction.maxPrice')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marketPrices.slice(0, 6).map((m, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold text-dark">{m.crop_name}</td>
                            <td className="text-muted">{m.market_name}</td>
                            <td className="text-end fw-bold text-success">₹{m.modal_price}</td>
                            <td className="text-end text-muted small">₹{m.min_price} - ₹{m.max_price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* History Table */}
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                <h6 className="fw-bold text-dark mb-0">
                  <i className="bi bi-clock-history me-2 text-secondary"></i>
                  {t('profitHistory')}
                </h6>
                <span className="badge bg-light text-muted border">{history.length} {t('profitPrediction.records')}</span>
              </div>
              <div className="card-body p-0">
                {history.length === 0 ? (
                  <div className="text-center py-4 text-muted small">
                    {t('profitPrediction.noHistory')}
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 small">
                      <thead className="table-light">
                        <tr>
                          <th>{t('common.date')}</th>
                          <th>{t('cropName')}</th>
                          <th className="text-end">{t('common.total')} {t('reports.cost')} (₹)</th>
                          <th className="text-end">{t('profitPrediction.expectedYield')}</th>
                          <th className="text-end">{t('common.price')}</th>
                          <th className="text-end">{t('netProfit')} (₹)</th>
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
                            <td className="fw-semibold">{h.crop_name}</td>
                            <td className="text-end text-danger">₹{Number(h.estimated_cost).toLocaleString('en-IN')}</td>
                            <td className="text-end">{h.predicted_yield} Qtl</td>
                            <td className="text-end">₹{Number(h.estimated_selling_price).toLocaleString('en-IN')}</td>
                            <td className={`text-end fw-bold ${Number(h.predicted_profit) >= 0 ? 'text-success' : 'text-danger'}`}>
                              {Number(h.predicted_profit) >= 0 ? '+' : ''}₹{Number(h.predicted_profit).toLocaleString('en-IN')}
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
