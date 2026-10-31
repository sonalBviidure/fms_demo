import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchAIAdvisoryLogs,
  fetchMLModelsStatus,
  retrainMLModels,
} from '../../services/adminApi';

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function AdminAIAdvisoryPage() {
  const [activeTab, setActiveTab] = useState('MODELS'); // 'MODELS' | 'CROP_RECS' | 'YIELD_PREDS' | 'PROFIT_PREDS'
  const [modelsData, setModelsData] = useState({ models: [], models_directory: '' });
  const [advisoryLogs, setAdvisoryLogs] = useState({
    crop_recommendations: [],
    yield_predictions: [],
    profit_predictions: [],
  });
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [toast, setToast] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [m, a] = await Promise.all([fetchMLModelsStatus(), fetchAIAdvisoryLogs()]);
      setModelsData(m);
      setAdvisoryLogs(a);
    } catch (e) {
      showToast(e.message, 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleRetrain() {
    setRetraining(true);
    try {
      const res = await retrainMLModels();
      showToast(res.message);
      loadAll();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setRetraining(false);
    }
  }

  const totalLogs =
    advisoryLogs.crop_recommendations.length +
    advisoryLogs.yield_predictions.length +
    advisoryLogs.profit_predictions.length;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`alert alert-${toast.type} position-fixed top-0 end-0 m-3 shadow-sm py-2 px-3`}
          style={{ zIndex: 9999, minWidth: 280 }}
        >
          <i className={`bi bi-${toast.type === 'success' ? 'check-circle-fill' : 'exclamation-circle-fill'} me-2`}></i>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">
            <i className="bi bi-cpu-fill me-2 text-info"></i>AI & Machine Learning Advisory Operations
          </h4>
          <small className="text-muted">
            Monitor Scikit-Learn advisory pipelines, model serialization status, and farmer consultation logs
          </small>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-success btn-sm" onClick={loadAll}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
          <button
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            onClick={handleRetrain}
            disabled={retraining}
          >
            {retraining ? (
              <>
                <span className="spinner-border spinner-border-sm me-1"></span>
                <span>Training Models...</span>
              </>
            ) : (
              <>
                <i className="bi bi-gear-wide-connected"></i>
                <span>Retrain ML Pipelines</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Total AI Consultations</div>
            <div className="fw-bold fs-3 text-info">{totalLogs}</div>
            <small className="text-muted">Advisory interactions</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Crop Recommendations</div>
            <div className="fw-bold fs-3 text-primary">{advisoryLogs.crop_recommendations.length}</div>
            <small className="text-muted">RandomForestClassifier</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Yield Predictions</div>
            <div className="fw-bold fs-3 text-success">{advisoryLogs.yield_predictions.length}</div>
            <small className="text-muted">GradientBoostingRegressor</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Profit Margin Forecasts</div>
            <div className="fw-bold fs-3 text-warning">{advisoryLogs.profit_predictions.length}</div>
            <small className="text-muted">RandomForestRegressor</small>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-2">
          <ul className="nav nav-pills nav-fill gap-2 small">
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold py-2 ${
                  activeTab === 'MODELS' ? 'bg-primary text-white' : 'text-secondary'
                }`}
                onClick={() => setActiveTab('MODELS')}
              >
                <i className="bi bi-box-seam me-1"></i>ML Model Health & Artifacts
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold py-2 ${
                  activeTab === 'CROP_RECS' ? 'bg-primary text-white' : 'text-secondary'
                }`}
                onClick={() => setActiveTab('CROP_RECS')}
              >
                <i className="bi bi-flower1 me-1"></i>Crop Recommendations ({advisoryLogs.crop_recommendations.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold py-2 ${
                  activeTab === 'YIELD_PREDS' ? 'bg-primary text-white' : 'text-secondary'
                }`}
                onClick={() => setActiveTab('YIELD_PREDS')}
              >
                <i className="bi bi-graph-up-arrow me-1"></i>Yield Predictions ({advisoryLogs.yield_predictions.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold py-2 ${
                  activeTab === 'PROFIT_PREDS' ? 'bg-primary text-white' : 'text-secondary'
                }`}
                onClick={() => setActiveTab('PROFIT_PREDS')}
              >
                <i className="bi bi-cash-coin me-1"></i>Profit Forecasts ({advisoryLogs.profit_predictions.length})
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* ── TAB 1: MODELS HEALTH ────────────────────────────────────────── */}
      {activeTab === 'MODELS' && (
        <div className="row g-4">
          {(modelsData.models || []).map((m, idx) => (
            <div key={idx} className="col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div
                      className="d-flex align-items-center justify-content-center bg-info-subtle rounded-3"
                      style={{ width: 44, height: 44 }}
                    >
                      <i className="bi bi-cpu text-info fs-5"></i>
                    </div>
                    <span
                      className={`badge ${
                        m.exists ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                      }`}
                    >
                      <i className={`bi bi-${m.exists ? 'check-circle' : 'x-circle'} me-1`}></i>
                      {m.status}
                    </span>
                  </div>

                  <h6 className="fw-bold mb-1 text-dark">{m.name}</h6>
                  <p className="small text-muted mb-3">{m.description}</p>

                  <ul className="list-group list-group-flush small mb-3">
                    <li className="list-group-item px-0 py-2 d-flex justify-content-between">
                      <span className="text-muted">Algorithm</span>
                      <span className="fw-semibold text-end" style={{ maxWidth: '60%' }}>
                        {m.algorithm}
                      </span>
                    </li>
                    <li className="list-group-item px-0 py-2 d-flex justify-content-between">
                      <span className="text-muted">Serialized File</span>
                      <span className="font-monospace text-dark">{m.filename}</span>
                    </li>
                    <li className="list-group-item px-0 py-2 d-flex justify-content-between">
                      <span className="text-muted">Model Size</span>
                      <span className="fw-bold">{m.size_kb} KB</span>
                    </li>
                    <li className="list-group-item px-0 py-2 d-flex justify-content-between">
                      <span className="text-muted">Last Trained</span>
                      <span className="text-muted">{m.last_modified}</span>
                    </li>
                  </ul>
                </div>
                <div className="card-footer bg-light border-0 py-2 px-4 small text-muted">
                  Pipeline location: <code>backend/ml_models/saved_models</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 2: CROP RECOMMENDATIONS ──────────────────────────────────── */}
      {activeTab === 'CROP_RECS' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            {advisoryLogs.crop_recommendations.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
                No crop recommendation requests logged.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Farmer</th>
                      <th>Soil Type</th>
                      <th>Season</th>
                      <th>Weather Condition</th>
                      <th>Irrigation Mode</th>
                      <th>AI Recommended Crop</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advisoryLogs.crop_recommendations.map((r) => (
                      <tr key={r.id}>
                        <td className="text-muted">{r.date}</td>
                        <td className="fw-semibold text-dark">{r.farmer}</td>
                        <td>
                          <span className="badge bg-secondary-subtle text-secondary">{r.soil_type}</span>
                        </td>
                        <td>{r.season}</td>
                        <td className="text-muted">{r.weather}</td>
                        <td>{r.irrigation}</td>
                        <td>
                          <span className="badge bg-success px-2 py-1 fs-6">
                            <i className="bi bi-check-lg me-1"></i>
                            {r.recommended_crop}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: YIELD PREDICTIONS ─────────────────────────────────────── */}
      {activeTab === 'YIELD_PREDS' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            {advisoryLogs.yield_predictions.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
                No yield prediction models consulted yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Farmer</th>
                      <th>Target Crop</th>
                      <th className="text-center">Area</th>
                      <th>Season</th>
                      <th>Soil Type</th>
                      <th className="text-center">Rainfall (mm)</th>
                      <th className="text-end fw-bold">Predicted Yield</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advisoryLogs.yield_predictions.map((y) => (
                      <tr key={y.id}>
                        <td className="text-muted">{y.date}</td>
                        <td className="fw-semibold text-dark">{y.farmer}</td>
                        <td className="fw-semibold text-primary">{y.crop_name}</td>
                        <td className="text-center">{y.land_area} Ac</td>
                        <td>{y.season}</td>
                        <td>{y.soil_type}</td>
                        <td className="text-center">{y.rainfall} mm</td>
                        <td className="text-end fw-bold text-success fs-6">
                          {y.predicted_yield} Quintals
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: PROFIT PREDICTIONS ────────────────────────────────────── */}
      {activeTab === 'PROFIT_PREDS' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            {advisoryLogs.profit_predictions.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
                No profit prediction analyses recorded.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Farmer</th>
                      <th>Crop</th>
                      <th className="text-end">Estimated Cost</th>
                      <th className="text-center">Expected Yield</th>
                      <th className="text-end">APMC Price Benchmark</th>
                      <th className="text-end fw-bold">Predicted Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advisoryLogs.profit_predictions.map((p) => (
                      <tr key={p.id}>
                        <td className="text-muted">{p.date}</td>
                        <td className="fw-semibold text-dark">{p.farmer}</td>
                        <td className="fw-semibold text-primary">{p.crop_name}</td>
                        <td className="text-end text-danger">{fmtINR(p.estimated_cost)}</td>
                        <td className="text-center">{p.predicted_yield} Qtl</td>
                        <td className="text-end text-muted">{fmtINR(p.estimated_selling_price)} / Qtl</td>
                        <td
                          className={`text-end fw-bold fs-6 ${
                            p.predicted_profit >= 0 ? 'text-success' : 'text-danger'
                          }`}
                        >
                          {fmtINR(p.predicted_profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
