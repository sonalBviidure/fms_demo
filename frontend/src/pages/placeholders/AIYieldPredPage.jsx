import React, { useState, useEffect } from 'react';
import { getCrops, getYieldPredictions, submitYieldPrediction } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Crop Yield Calculator Page
 */

const SOIL_TYPES = ['Black', 'Alluvial', 'Loamy', 'Red', 'Clayey', 'Sandy', 'Other'];
const SEASONS = ['Kharif', 'Rabi', 'Zaid', 'Annual'];
const FERTILIZER_OPTIONS = [
  { value: 'High (Urea + DAP)', key: 'high' },
  { value: 'Medium (NPK Balanced)', key: 'medium' },
  { value: 'Low / Organic Compost', key: 'low' },
  { value: 'None', key: 'none' },
];

export default function AIYieldPredPage() {
  const { t } = useLanguage();

  const [crops, setCrops] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    crop: '',
    land_area: '',
    season: 'Kharif',
    soil_type: 'Black',
    fertilizer_use: 'Medium (NPK Balanced)',
    rainfall: '750',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setInitialLoading(true);
    try {
      const [cropData, histData] = await Promise.all([
        getCrops(),
        getYieldPredictions(),
      ]);
      setCrops(cropData);
      setHistory(histData);

      if (cropData.length > 0 && !form.crop) {
        const firstCrop = cropData[0];
        setForm((prev) => ({
          ...prev,
          crop: firstCrop.id,
          land_area: firstCrop.field_land_area || '2.0',
          season: firstCrop.season || 'Kharif',
        }));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setInitialLoading(false);
    }
  }

  function handleCropChange(e) {
    const selectedCropId = parseInt(e.target.value);
    const selected = crops.find((c) => c.id === selectedCropId);
    setForm((prev) => ({
      ...prev,
      crop: selectedCropId,
      land_area: selected?.field_land_area || prev.land_area,
      season: selected?.season || prev.season,
    }));
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.crop) {
      setError(t('yieldPrediction.selectActiveCrop'));
      return;
    }
    if (!form.land_area || parseFloat(form.land_area) <= 0) {
      setError(t('yieldPrediction.validLandArea'));
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const payload = {
        crop: parseInt(form.crop),
        land_area: parseFloat(form.land_area),
        season: form.season,
        soil_type: form.soil_type,
        fertilizer_use: form.fertilizer_use,
        rainfall: form.rainfall ? parseFloat(form.rainfall) : null,
      };

      const res = await submitYieldPrediction(payload);
      setResult(res.prediction);
      await loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedCropObj = crops.find((c) => c.id === parseInt(form.crop));

  return (
    <div className="container-fluid py-3">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">
            <i className="bi bi-bar-chart-steps text-info me-2"></i>{t('yieldPrediction.title')}
          </h2>
          <p className="text-muted mb-0 small">
            {t('yieldPrediction.subtitle')}
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {initialLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status"></div>
          <p className="mt-2 text-muted">{t('loading')}</p>
        </div>
      ) : crops.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
          <i className="bi bi-flower2 fs-1 text-muted mb-3"></i>
          <h4>{t('yieldPrediction.noCropsFound')}</h4>
          <p className="text-muted mx-auto" style={{ maxWidth: '480px' }}>
            {t('yieldPrediction.registerCropFirst')}
          </p>
          <div>
            <a href="/crops" className="btn btn-fms-primary px-4">
              <i className="bi bi-plus-lg me-1"></i>{t('yieldPrediction.addCropFirst')}
            </a>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {/* Prediction Input Form */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="fw-bold text-dark mb-0">
                  <i className="bi bi-sliders me-2 text-info"></i>{t('cultivationParams')}
                </h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">{t('targetCrop')} *</label>
                    <select
                      className="form-select"
                      name="crop"
                      value={form.crop}
                      onChange={handleCropChange}
                      required
                    >
                      {crops.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.crop_name} {c.variety ? `(${c.variety})` : ''} — {c.season} ({c.field_name || 'Plot'})
                        </option>
                      ))}
                    </select>
                    {selectedCropObj && (
                      <div className="form-text small text-muted">
                        {t('yieldPrediction.field')} <strong>{selectedCropObj.field_name}</strong> | {t('sowingDate')}: {selectedCropObj.sowing_date}
                      </div>
                    )}
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold small">{t('landArea')} *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        className="form-control"
                        name="land_area"
                        value={form.land_area}
                        onChange={handleChange}
                        required
                        placeholder="e.g. 2.5"
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold small">{t('farmingSeason')}</label>
                      <select
                        className="form-select"
                        name="season"
                        value={form.season}
                        onChange={handleChange}
                      >
                        {SEASONS.map((s) => (
                          <option key={s} value={s}>{t(`seasonLabels.${s}`, { defaultValue: s })}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold small">{t('soilType')}</label>
                      <select
                        className="form-select"
                        name="soil_type"
                        value={form.soil_type}
                        onChange={handleChange}
                      >
                        {SOIL_TYPES.map((st) => (
                          <option key={st} value={st}>{t('common.soilLabel', { type: st })}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold small">{t('rainfall')}</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        className="form-control"
                        name="rainfall"
                        value={form.rainfall}
                        onChange={handleChange}
                        placeholder="e.g. 750"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold small">{t('fertilizerRegimen')}</label>
                    <select
                      className="form-select"
                      name="fertilizer_use"
                      value={form.fertilizer_use}
                      onChange={handleChange}
                    >
                      {FERTILIZER_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {t(`fertilizerOptions.${f.key}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-info text-white w-100 py-2 fw-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {t('calculating')}
                      </>
                    ) : (
                      <>
                        <i className="bi bi-magic me-2"></i>{t('calculateYield')}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Prediction Result Display */}
          <div className="col-lg-6">
            {result ? (
              <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
                <div className="card-header bg-info-subtle border-bottom py-3">
                  <span className="badge bg-info text-white float-end">{t('yieldPrediction.modelEvaluated')}</span>
                  <h5 className="fw-bold text-info-emphasis mb-0">
                    <i className="bi bi-award me-2"></i>{t('yieldPrediction.yieldEstimate')}
                  </h5>
                </div>
                <div className="card-body p-4 text-center">
                  <div className="my-3">
                    <span className="text-muted small text-uppercase fw-semibold d-block">{t('estimatedHarvest')}</span>
                    <h1 className="display-4 fw-bold text-success my-2">
                      {result.predicted_yield} <span className="fs-4 text-secondary">{t('common.quintals')}</span>
                    </h1>
                    <div className="text-muted">
                      ≈ <strong>{(result.predicted_yield / 10).toFixed(2)} {t('common.metricTonnes')}</strong>
                    </div>
                  </div>

                  <hr className="my-4" />

                  <div className="row g-2 text-start">
                    <div className="col-6">
                      <div className="p-3 bg-light rounded-3">
                        <small className="text-muted d-block">{t('yieldPrediction.yieldPerAcre')}</small>
                        <strong className="fs-5 text-dark">
                          {(result.predicted_yield / (result.land_area || 1)).toFixed(2)} Qtl / {t('acres')}
                        </strong>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 bg-light rounded-3">
                        <small className="text-muted d-block">{t('yieldPrediction.cultivatedLand')}</small>
                        <strong className="fs-5 text-dark">{result.land_area} {t('acres')}</strong>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 bg-light rounded-3">
                        <small className="text-muted d-block">{t('yieldPrediction.seasonAndSoil')}</small>
                        <strong className="text-dark">{t(`seasonLabels.${result.season}`, { defaultValue: result.season })} | {t('common.soilLabel', { type: result.soil_type })}</strong>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 bg-light rounded-3">
                        <small className="text-muted d-block">{t('yieldPrediction.rainfallFeed')}</small>
                        <strong className="text-dark">{result.rainfall ? `${result.rainfall} mm` : '—'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-success border-0 rounded-3 mt-4 text-start mb-0 small">
                    <i className="bi bi-lightbulb-fill text-success me-2"></i>
                    <strong>{t('yieldPrediction.agronomicInsight')}</strong>{' '}
                    {t('yieldPrediction.insightText', { soil: result.soil_type, fertilizer: result.fertilizer_use || 'balanced' })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card border-0 shadow-sm rounded-4 h-100 bg-white d-flex align-items-center justify-content-center p-5 text-center text-muted">
                <i className="bi bi-graph-up-arrow fs-1 text-info opacity-50 mb-3"></i>
                <h5 className="fw-semibold text-dark">{t('yieldPrediction.readyForPrediction')}</h5>
                <p className="small mb-0" style={{ maxWidth: '360px' }}>
                  {t('yieldPrediction.readyHint')}
                </p>
              </div>
            )}
          </div>

          {/* Historical Predictions Table */}
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4 bg-white">
              <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold text-dark mb-0">
                  <i className="bi bi-clock-history me-2 text-secondary"></i>{t('historicalPredictions')}
                </h5>
                <span className="badge bg-light text-muted border">{history.length} {t('yieldPrediction.savedRuns')}</span>
              </div>
              <div className="card-body p-0">
                {history.length === 0 ? (
                  <div className="text-center py-4 text-muted small">
                    {t('yieldPrediction.noPastPredictions')}
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light small">
                        <tr>
                          <th>{t('common.date')}</th>
                          <th>{t('yieldPrediction.crop')}</th>
                          <th>{t('yieldPrediction.areaAcres')}</th>
                          <th>{t('season')}</th>
                          <th>{t('soilType')}</th>
                          <th>{t('rainfall')}</th>
                          <th>{t('yieldPrediction.fertilizer')}</th>
                          <th className="text-end">{t('yieldPrediction.predictedYield')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h) => (
                          <tr key={h.id}>
                            <td className="small text-muted">
                              {h.prediction_date ? new Date(h.prediction_date).toLocaleDateString() : 'Recent'}
                            </td>
                            <td className="fw-semibold text-dark">{h.crop_name}</td>
                            <td>{h.land_area}</td>
                            <td><span className="badge bg-secondary-subtle text-secondary">{t(`seasonLabels.${h.season}`, { defaultValue: h.season })}</span></td>
                            <td>{t('common.soilLabel', { type: h.soil_type })}</td>
                            <td>{h.rainfall ? `${h.rainfall} mm` : '-'}</td>
                            <td className="small text-muted">{h.fertilizer_use || '-'}</td>
                            <td className="text-end fw-bold text-success fs-6">
                              {h.predicted_yield} Qtl
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
