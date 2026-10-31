import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchFarmers, fetchFarmerReport } from '../../services/adminApi';

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function AdminFarmerLookupPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [farmerReport, setFarmerReport] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [error, setError] = useState('');
  const [showActiveFarmersPdf, setShowActiveFarmersPdf] = useState(false);

  // Load all farmers for dropdown
  const loadFarmers = useCallback(async () => {
    setLoadingList(true);
    setError('');
    try {
      const data = await fetchFarmers();
      const list = Array.isArray(data) ? data : [];
      setFarmers(list);

      // If URL has ?id=, select it; otherwise pick first farmer
      const queryId = searchParams.get('id');
      if (queryId) {
        setSelectedFarmerId(queryId);
        loadFarmerDetails(queryId);
      } else if (list.length > 0) {
        const firstId = list[0].id.toString();
        setSelectedFarmerId(firstId);
        loadFarmerDetails(firstId);
      }
    } catch (err) {
      setError(err.message || 'Failed to load farmers list.');
    } finally {
      setLoadingList(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadFarmers();
  }, [loadFarmers]);

  async function loadFarmerDetails(userId) {
    if (!userId) {
      setFarmerReport(null);
      return;
    }
    setLoadingReport(true);
    setError('');
    try {
      const report = await fetchFarmerReport(userId);
      setFarmerReport(report);
    } catch (err) {
      setError(`Failed to load farmer dossier: ${err.message}`);
    } finally {
      setLoadingReport(false);
    }
  }

  function handleSelectFarmer(e) {
    const id = e.target.value;
    setSelectedFarmerId(id);
    if (id) {
      setSearchParams({ id });
      loadFarmerDetails(id);
    } else {
      setSearchParams({});
      setFarmerReport(null);
    }
  }

  // Filter farmers for dropdown
  const filteredDropdownFarmers = farmers.filter((f) => {
    const q = (searchFilter || '').toLowerCase().trim();
    if (!q) return true;
    const name = (f.name || f.username || '').toLowerCase();
    const phone = (f.phone || '').toLowerCase();
    const loc = (f.location || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || loc.includes(q);
  });

  const activeFarmersList = farmers.filter((f) => f.is_active);

  function printSingleFarmerDossier() {
    window.print();
  }

  // Safe extractions from farmerReport
  const farmer = farmerReport?.farmer || {};
  const summary = farmerReport?.summary || {};
  const crops = farmerReport?.crops || [];
  const fields = farmerReport?.fields || [];
  const expenseBreakdown = farmerReport?.expense_breakdown || [];
  const recommendations = farmerReport?.ai_recommendations || farmerReport?.recommendations || [];

  return (
    <div>
      {/* Print-only CSS to format neat PDF exports */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-section, .print-section * { visibility: visible !important; }
          .print-section {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 no-print">
        <div>
          <h4 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
            <i className="bi bi-people-fill text-success"></i>
            <span>Farmer Lookup &amp; Intelligence</span>
          </h4>
          <small className="text-muted">
            Select a farmer from the dropdown to inspect their full profile, parcels, crops, and financial dossier
          </small>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Export Active Farmers PDF Button */}
          <button
            className="btn btn-outline-success btn-sm d-flex align-items-center gap-1 shadow-sm fw-semibold"
            onClick={() => setShowActiveFarmersPdf(true)}
            title="Generate printable PDF summary of all active farmers"
          >
            <i className="bi bi-file-earmark-pdf-fill text-danger"></i>
            <span>PDF: All Active Farmers ({activeFarmersList.length})</span>
          </button>

          {/* Print Single Farmer Report */}
          {farmerReport && (
            <button
              className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm fw-semibold"
              onClick={printSingleFarmerDossier}
              title="Print or save PDF of currently selected farmer"
            >
              <i className="bi bi-printer-fill"></i>
              <span>Print / Save Farmer Dossier (PDF)</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 small mb-4 no-print d-flex align-items-center justify-content-between">
          <div>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
          <button className="btn btn-sm btn-outline-danger" onClick={loadFarmers}>
            Retry
          </button>
        </div>
      )}

      {/* ── Farmer Selection Dropdown Card ── */}
      <div className="card border-0 shadow-sm mb-4 bg-white no-print" style={{ borderRadius: 12 }}>
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-5">
              <label className="form-label small fw-bold text-dark mb-1">
                <i className="bi bi-person-lines-fill text-success me-1"></i>
                Select Farmer Dropdown:
              </label>
              {loadingList ? (
                <div className="d-flex align-items-center gap-2 text-muted small py-1">
                  <span className="spinner-border spinner-border-sm text-success"></span>
                  <span>Loading farmers list...</span>
                </div>
              ) : (
                <select
                  className="form-select form-select-sm border-success fw-semibold"
                  value={selectedFarmerId}
                  onChange={handleSelectFarmer}
                >
                  <option value="">-- Choose a farmer from dropdown --</option>
                  {filteredDropdownFarmers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name || f.username} — {f.location || 'Maharashtra'} ({f.total_acres || 0} Ac) [{f.is_active ? 'Active' : 'Inactive'}]
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold text-muted mb-1">
                Filter dropdown by Name, Phone, Village:
              </label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="e.g. Sonali, Sangli, 98..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
                {searchFilter && (
                  <button className="btn btn-outline-secondary" type="button" onClick={() => setSearchFilter('')}>
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-3 text-md-end">
              <span className="badge bg-light text-secondary border p-2">
                Total Registered: <strong>{farmers.length} Farmers</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Selected Farmer Dossier View ── */}
      {loadingReport ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" style={{ width: 40, height: 40 }}></div>
          <p className="mt-2 text-muted small">Loading farmer intelligence dossier...</p>
        </div>
      ) : farmerReport && farmer.id ? (
        <div className="print-section">
          {/* Farmer Profile Hero Header */}
          <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 14 }}>
            <div className="card-body p-4">
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center bg-success text-white rounded-circle fs-3 shadow-sm flex-shrink-0"
                    style={{ width: 62, height: 62 }}
                  >
                    <i className="bi bi-person-fill"></i>
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <h4 className="fw-bold mb-0 text-dark">{farmer.full_name || farmer.username}</h4>
                      <span className={`badge ${farmer.is_active ? 'bg-success' : 'bg-danger'}`}>
                        {farmer.is_active ? 'Active Farmer' : 'Inactive Account'}
                      </span>
                    </div>
                    <div className="text-muted small mt-1">
                      <span>@{farmer.username}</span> &middot;{' '}
                      <i className="bi bi-telephone text-success me-1"></i>
                      <span>{farmer.phone || 'No phone recorded'}</span> &middot;{' '}
                      <i className="bi bi-geo-alt text-danger me-1"></i>
                      <span>{farmer.location || 'Maharashtra, India'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-end">
                  <div className="text-muted small">Member Since</div>
                  <div className="fw-semibold text-dark">{farmer.joined || '—'}</div>
                  <div className="badge bg-light text-secondary border mt-1">
                    System ID: #{farmer.id}
                  </div>
                </div>
              </div>

              {/* 4 Quick Stat Metric Cards */}
              <div className="row g-3 mt-3 pt-3 border-top">
                <div className="col-6 col-md-3">
                  <div className="p-3 bg-light rounded-3">
                    <small className="text-muted d-block">Total Agricultural Land</small>
                    <div className="fw-bold fs-4 text-dark">{farmer.total_acres || 0} Acres</div>
                    <small className="text-muted">{summary.total_fields || fields.length} Land Parcels</small>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="p-3 bg-light rounded-3">
                    <small className="text-muted d-block">Crop Cycles</small>
                    <div className="fw-bold fs-4 text-primary">{summary.total_crops || crops.length} Total</div>
                    <small className="text-success fw-semibold">{summary.active_crops || 0} active in field</small>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="p-3 bg-light rounded-3">
                    <small className="text-muted d-block">Input Expenses</small>
                    <div className="fw-bold fs-4 text-danger">{fmtINR(summary.total_expenses)}</div>
                    <small className="text-muted">Seeds, fertilizer, labor</small>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="p-3 bg-light rounded-3">
                    <small className="text-muted d-block">Harvest Sales Revenue</small>
                    <div className="fw-bold fs-4 text-success">{fmtINR(summary.total_revenue)}</div>
                    <small className={(summary.net_profit || 0) >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                      Net: {(summary.net_profit || 0) >= 0 ? '+' : ''}{fmtINR(summary.net_profit)}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Left: Land Parcels & Crops */}
            <div className="col-lg-8">
              {/* Crops Table */}
              <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
                <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold mb-0 text-dark">
                    <i className="bi bi-flower1 text-success me-2"></i>
                    Cultivated Crops &amp; Harvest History ({crops.length})
                  </h6>
                </div>
                <div className="card-body p-0">
                  {crops.length === 0 ? (
                    <div className="text-center py-4 text-muted small">No crops planted by this farmer yet.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0 small">
                        <thead className="table-light">
                          <tr>
                            <th>Crop / Variety</th>
                            <th>Field Plot</th>
                            <th>Season</th>
                            <th>Sown Date</th>
                            <th>Status</th>
                            <th className="text-end">Expenses</th>
                            <th className="text-end">Revenue</th>
                            <th className="text-end fw-bold">Net Profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {crops.map((c) => (
                            <tr key={c.id}>
                              <td>
                                <div className="fw-bold text-dark">{c.crop_name}</div>
                                {c.variety && <small className="text-muted">Var: {c.variety}</small>}
                              </td>
                              <td>
                                {c.field_name || '—'}
                                {c.land_area ? <small className="text-muted d-block">({c.land_area} Ac)</small> : null}
                              </td>
                              <td><span className="badge bg-light text-secondary border">{c.season}</span></td>
                              <td className="text-muted">{c.sowing_date || '—'}</td>
                              <td>
                                <span className={`badge ${
                                  c.status === 'Growing' ? 'bg-success-subtle text-success' :
                                  c.status === 'Harvested' ? 'bg-warning-subtle text-warning-emphasis' :
                                  'bg-info-subtle text-info'
                                }`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="text-end text-danger">{fmtINR(c.total_expenses)}</td>
                              <td className="text-end text-success">{fmtINR(c.total_revenue)}</td>
                              <td className={`text-end fw-bold ${Number(c.profit || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                                {Number(c.profit || 0) >= 0 ? '+' : ''}{fmtINR(c.profit)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Land Parcels Table */}
              <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: 12 }}>
                <div className="card-header bg-white border-bottom py-3">
                  <h6 className="fw-bold mb-0 text-dark">
                    <i className="bi bi-grid-3x3-gap-fill text-primary me-2"></i>
                    Registered Land Parcels &amp; Soil Profiles ({fields.length})
                  </h6>
                </div>
                <div className="card-body p-0">
                  {fields.length === 0 ? (
                    <div className="text-center py-4 text-muted small">No land plots registered yet.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0 small">
                        <thead className="table-light">
                          <tr>
                            <th>Field Plot Name</th>
                            <th>Land Area</th>
                            <th>Soil Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fields.map((f, idx) => (
                            <tr key={f.id || idx}>
                              <td className="fw-semibold text-dark">{f.field_name}</td>
                              <td className="fw-bold text-success">{f.land_area} Acres</td>
                              <td><span className="badge bg-secondary-subtle text-secondary">{f.soil_type || 'Loamy'} Soil</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Expense Breakdown & AI History */}
            <div className="col-lg-4">
              {/* Expense Breakdown */}
              <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
                <div className="card-header bg-white border-bottom py-3">
                  <h6 className="fw-bold mb-0 text-dark">
                    <i className="bi bi-receipt text-danger me-2"></i>
                    Cost Breakdown by Category
                  </h6>
                </div>
                <div className="card-body p-3">
                  {expenseBreakdown.length === 0 ? (
                    <div className="text-center py-3 text-muted small">No categorized expenses logged.</div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {expenseBreakdown.map((e, idx) => (
                        <div key={idx} className="d-flex justify-content-between align-items-center small p-2 bg-light rounded">
                          <span className="text-dark fw-medium">{e.category}</span>
                          <span className="text-danger fw-bold">{fmtINR(e.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* AI History */}
              <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: 12 }}>
                <div className="card-header bg-white border-bottom py-3">
                  <h6 className="fw-bold mb-0 text-dark">
                    <i className="bi bi-cpu-fill text-info me-2"></i>
                    Recent AI Crop Consultations
                  </h6>
                </div>
                <div className="card-body p-0">
                  {recommendations.length === 0 ? (
                    <div className="text-center py-3 text-muted small">No AI consultations logged yet.</div>
                  ) : (
                    <ul className="list-group list-group-flush small">
                      {recommendations.map((r, idx) => (
                        <li key={idx} className="list-group-item d-flex justify-content-between align-items-center py-2 px-3">
                          <div>
                            <div className="fw-semibold text-dark">{r.crop}</div>
                            <small className="text-muted">{r.soil || 'Black'} Soil &middot; {r.season || 'Kharif'}</small>
                          </div>
                          <span className="badge bg-light text-secondary border">{r.date}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm bg-white p-5 text-center text-muted" style={{ borderRadius: 12 }}>
          <i className="bi bi-arrow-up-circle fs-1 d-block mb-2 text-success opacity-50"></i>
          <h5>No Farmer Selected</h5>
          <p className="small mb-0">Please select a farmer from the dropdown menu above to inspect their intelligence dossier.</p>
        </div>
      )}

      {/* ── All Active Farmers Printable Report Modal ── */}
      {showActiveFarmersPdf && (
        <div
          className="modal d-block"
          style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1050, position: 'fixed', inset: 0 }}
          onClick={(e) => e.target === e.currentTarget && setShowActiveFarmersPdf(false)}
        >
          <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
              <div className="modal-header bg-success text-white py-3">
                <h5 className="modal-title mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-file-earmark-pdf-fill"></i>
                  <span>Official Report: All Active Farmers ({activeFarmersList.length})</span>
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setShowActiveFarmersPdf(false)}></button>
              </div>

              <div className="modal-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                  <div>
                    <h5 className="fw-bold mb-0">Farm Management System — Active Farmers Directory</h5>
                    <small className="text-muted">Generated by System Admin Operations on {new Date().toLocaleDateString('en-IN')}</small>
                  </div>
                  <button className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={() => window.print()}>
                    <i className="bi bi-printer"></i>
                    <span>Print Directory (PDF)</span>
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle small mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Farmer Full Name</th>
                        <th>Username</th>
                        <th>Contact Phone</th>
                        <th>Village / Location</th>
                        <th className="text-end">Land Acreage</th>
                        <th>Member Since</th>
                        <th className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeFarmersList.map((f, i) => (
                        <tr key={f.id || i}>
                          <td>{i + 1}</td>
                          <td className="fw-bold text-dark">{f.name || f.username}</td>
                          <td className="font-monospace text-muted">@{f.username}</td>
                          <td>{f.phone || '—'}</td>
                          <td>{f.location || 'Maharashtra'}</td>
                          <td className="text-end fw-bold text-success">{f.total_acres || 0} Acres</td>
                          <td>{f.date_joined || f.joined || '—'}</td>
                          <td className="text-center">
                            <span className="badge bg-success-subtle text-success border border-success-subtle">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer bg-light py-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowActiveFarmersPdf(false)}>
                  Close
                </button>
                <button className="btn btn-success btn-sm" onClick={() => window.print()}>
                  <i className="bi bi-download me-1"></i>
                  Save as PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
