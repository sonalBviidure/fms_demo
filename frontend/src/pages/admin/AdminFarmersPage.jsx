import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchFarmers,
  createFarmer,
  updateFarmer,
  resetFarmerPassword,
  toggleFarmer,
  deleteFarmer,
  fetchFarmerReport,
} from '../../services/adminApi';

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// ── Mini progress bar for expense breakdown ─────────────────────────────────
function MiniBar({ label, value, max, color = 'bg-success' }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className="mb-2">
      <div className="d-flex justify-content-between small mb-1">
        <span className="text-truncate" style={{ maxWidth: '65%' }}>{label}</span>
        <span className="fw-semibold">{fmtINR(value)}</span>
      </div>
      <div className="progress" style={{ height: 6 }}>
        <div className={`progress-bar ${color}`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}

// ── Farmer Dossier Modal ─────────────────────────────────────────────────────
function FarmerDossierModal({ userId, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchFarmerReport(userId);
        setReport(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const farmer = report?.farmer || {};
  const summary = report?.summary || {};
  const crops = report?.crops || [];
  const fields = report?.fields || [];
  const expBreakdown = report?.expense_breakdown || [];
  const aiRecs = report?.ai_recommendations || [];
  const maxExp = Math.max(...expBreakdown.map((e) => e.amount), 1);
  const netColor = (summary.net_profit || 0) >= 0 ? 'text-success' : 'text-danger';

  return (
    <div
      className="modal d-block"
      style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050, position: 'fixed', inset: 0, overflowY: 'auto' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-dialog modal-xl modal-dialog-scrollable my-4" style={{ maxWidth: 960 }}>
        <div className="modal-content border-0 shadow-lg">
          {/* Header */}
          <div
            className="modal-header text-white"
            style={{ background: 'linear-gradient(135deg, #133a27, #2d6a4f)' }}
          >
            <div>
              <h5 className="modal-title mb-0">
                <i className="bi bi-person-lines-fill me-2"></i>
                Farmer Dossier — {farmer.full_name || '...'}
              </h5>
              <small style={{ opacity: 0.8 }}>
                @{farmer.username} &middot; {farmer.location} &middot; Phone: {farmer.phone}
              </small>
            </div>
            <button className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" style={{ width: 44, height: 44 }}></div>
                <div className="mt-3 text-muted small">Loading farmer intelligence...</div>
              </div>
            ) : error ? (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            ) : (
              <>
                {/* 4 Summary Stat Cards */}
                <div className="row g-3 mb-4">
                  <div className="col-6 col-md-3">
                    <div className="card border-0 shadow-sm p-3 bg-light">
                      <div className="text-muted small">Total Land Area</div>
                      <div className="fs-4 fw-bold text-success">{farmer.total_acres} Acres</div>
                      <small className="text-muted">{fields.length} land parcels</small>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="card border-0 shadow-sm p-3 bg-light">
                      <div className="text-muted small">Total Revenue</div>
                      <div className="fs-4 fw-bold text-success">{fmtINR(summary.total_revenue)}</div>
                      <small className="text-muted">Realized sales</small>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="card border-0 shadow-sm p-3 bg-light">
                      <div className="text-muted small">Cultivation Costs</div>
                      <div className="fs-4 fw-bold text-danger">{fmtINR(summary.total_expenses)}</div>
                      <small className="text-muted">Itemized expenses</small>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="card border-0 shadow-sm p-3 bg-light">
                      <div className="text-muted small">Net Agricultural Profit</div>
                      <div className={`fs-4 fw-bold ${netColor}`}>{fmtINR(summary.net_profit)}</div>
                      <small className="text-muted">₹{summary.profit_per_acre} / acre</small>
                    </div>
                  </div>
                </div>

                <div className="row g-4 mb-4">
                  {/* Land Parcels */}
                  <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-header bg-white fw-bold py-2">
                        <i className="bi bi-grid-3x3-gap-fill me-2 text-success"></i>Registered Fields
                      </div>
                      <div className="card-body p-0">
                        {fields.length === 0 ? (
                          <div className="p-3 text-muted small">No registered fields.</div>
                        ) : (
                          <ul className="list-group list-group-flush small">
                            {fields.map((f, i) => (
                              <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                  <div className="fw-semibold">{f.field_name}</div>
                                  <span className="badge bg-secondary-subtle text-secondary">{f.soil_type} Soil</span>
                                </div>
                                <span className="fw-bold text-dark">{f.land_area} Acres</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expense Breakdown */}
                  <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-header bg-white fw-bold py-2">
                        <i className="bi bi-pie-chart-fill me-2 text-danger"></i>Expense Categorization
                      </div>
                      <div className="card-body">
                        {expBreakdown.length === 0 ? (
                          <div className="text-muted small text-center py-3">No expenses recorded yet.</div>
                        ) : (
                          expBreakdown.map((e, idx) => (
                            <MiniBar key={idx} label={e.category} value={e.amount} max={maxExp} color="bg-danger" />
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cultivated Crops Lifecycle */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-white fw-bold py-2">
                    <i className="bi bi-flower1 me-2 text-primary"></i>Crops Cultivated ({crops.length})
                  </div>
                  <div className="card-body p-0">
                    {crops.length === 0 ? (
                      <div className="text-center text-muted py-4 small">No crops recorded yet.</div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0 small">
                          <thead className="table-light">
                            <tr>
                              <th>Crop & Variety</th>
                              <th>Field</th>
                              <th>Season</th>
                              <th>Status</th>
                              <th>Sown Date</th>
                              <th className="text-end">Expenses</th>
                              <th className="text-end">Revenue</th>
                              <th className="text-end">Net P/L</th>
                            </tr>
                          </thead>
                          <tbody>
                            {crops.map((c) => (
                              <tr key={c.id}>
                                <td>
                                  <div className="fw-semibold">{c.crop_name}</div>
                                  <small className="text-muted">{c.variety || 'Standard'}</small>
                                </td>
                                <td>
                                  <div>{c.field_name}</div>
                                  <small className="text-muted">{c.land_area} Ac</small>
                                </td>
                                <td>{c.season}</td>
                                <td>
                                  <span
                                    className={`badge ${
                                      c.status === 'Growing'
                                        ? 'bg-primary'
                                        : c.status === 'Harvested'
                                        ? 'bg-success'
                                        : c.status === 'Closed'
                                        ? 'bg-secondary'
                                        : 'bg-warning text-dark'
                                    }`}
                                  >
                                    {c.status}
                                  </span>
                                </td>
                                <td>{c.sowing_date}</td>
                                <td className="text-end text-danger">{fmtINR(c.total_expenses)}</td>
                                <td className="text-end text-success">{fmtINR(c.total_revenue)}</td>
                                <td className={`text-end fw-bold ${c.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                                  {fmtINR(c.profit)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI History */}
                {aiRecs.length > 0 && (
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white fw-bold py-2">
                      <i className="bi bi-cpu me-2 text-info"></i>AI Consultation Logs
                    </div>
                    <div className="card-body p-0">
                      <ul className="list-group list-group-flush small">
                        {aiRecs.map((r, i) => (
                          <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                              <span className="fw-semibold text-info">{r.crop}</span> recommended for {r.season} season
                              ({r.soil} soil)
                            </div>
                            <span className="text-muted">{r.date}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer bg-light">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
              <i className="bi bi-printer me-1"></i>Print Dossier
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Farmer Modal ─────────────────────────────────────────────────────────
function AddFarmerModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    username: '',
    phone: '',
    password: '',
    full_name: '',
    location: '',
    total_acres: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.username || !form.phone || !form.password || !form.location) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await createFarmer({
        ...form,
        total_acres: form.total_acres ? parseFloat(form.total_acres) : 0,
      });
      onSuccess(`Farmer ${form.full_name || form.username} successfully onboarded.`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal d-block"
      style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050, position: 'fixed', inset: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 500 }}>
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title mb-0">
              <i className="bi bi-person-plus-fill me-2"></i>Onboard New Farmer
            </h5>
            <button className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {error && (
                <div className="alert alert-danger py-2 small mb-3">
                  <i className="bi bi-exclamation-triangle me-1"></i>{error}
                </div>
              )}
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-semibold">Full Name *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g., Ramesh Patil"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold">Username *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g., ramesh_patil"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold">Phone (Login) *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="10-digit mobile"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Password *</label>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    placeholder="Initial login password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
                <div className="col-8">
                  <label className="form-label small fw-semibold">Village / Location *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g., Karveer, Kolhapur"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    required
                  />
                </div>
                <div className="col-4">
                  <label className="form-label small fw-semibold">Total Acres</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control form-control-sm"
                    placeholder="e.g., 5.5"
                    value={form.total_acres}
                    onChange={(e) => setForm({ ...form, total_acres: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-success btn-sm" disabled={submitting}>
                {submitting ? 'Creating...' : 'Register Farmer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Edit Farmer Modal ────────────────────────────────────────────────────────
function EditFarmerModal({ farmer, onClose, onSuccess }) {
  const [form, setForm] = useState({
    full_name: farmer.full_name || '',
    phone: farmer.phone || '',
    location: farmer.location || '',
    total_acres: farmer.total_acres || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await updateFarmer(farmer.id, form);
      onSuccess(`Farmer ${form.full_name} updated successfully.`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal d-block"
      style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050, position: 'fixed', inset: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 450 }}>
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-dark text-white">
            <h5 className="modal-title mb-0">
              <i className="bi bi-pencil-square me-2 text-warning"></i>Edit Farmer — @{farmer.username}
            </h5>
            <button className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}
              <div className="mb-3">
                <label className="form-label small fw-semibold">Full Name</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Phone Number</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Village / Location</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Total Acres</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control form-control-sm"
                  value={form.total_acres}
                  onChange={(e) => setForm({ ...form, total_acres: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Reset Password Modal ────────────────────────────────────────────────────
function ResetPasswordModal({ farmer, onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await resetFarmerPassword(farmer.id, password);
      onSuccess(`Password for ${farmer.username} successfully updated.`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal d-block"
      style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050, position: 'fixed', inset: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-warning-subtle text-warning-emphasis">
            <h5 className="modal-title mb-0">
              <i className="bi bi-key-fill me-2"></i>Reset Password
            </h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <p className="small text-muted mb-3">
                Set a new password for farmer <strong>{farmer.full_name}</strong> (@{farmer.username}).
              </p>
              {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}
              <div>
                <label className="form-label small fw-semibold">New Password</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-warning btn-sm" disabled={submitting}>
                {submitting ? 'Updating...' : 'Set New Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Main Farmers Page ───────────────────────────────────────────────────────
export default function AdminFarmersPage() {
  const [farmers, setFarmers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  // Modals state
  const [selectedDossierId, setSelectedDossierId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editFarmer, setEditFarmer] = useState(null);
  const [resetPwdFarmer, setResetPwdFarmer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadFarmers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFarmers();
      setFarmers(data);
      setFiltered(data);
    } catch (e) {
      showToast(e.message, 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFarmers();
  }, [loadFarmers]);

  useEffect(() => {
    let list = farmers;
    if (statusFilter === 'ACTIVE') list = list.filter((f) => f.is_active);
    if (statusFilter === 'INACTIVE') list = list.filter((f) => !f.is_active);

    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (f) =>
          f.full_name.toLowerCase().includes(q) ||
          f.username.toLowerCase().includes(q) ||
          (f.phone || '').includes(q) ||
          (f.location || '').toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [search, statusFilter, farmers]);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleToggle(farmer) {
    setActionLoading(farmer.id);
    try {
      const res = await toggleFarmer(farmer.id);
      setFarmers((prev) =>
        prev.map((f) => (f.id === farmer.id ? { ...f, is_active: res.is_active } : f))
      );
      showToast(res.message);
    } catch (e) {
      showToast(e.message, 'danger');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(farmer) {
    setActionLoading(farmer.id);
    setConfirmDelete(null);
    try {
      const res = await deleteFarmer(farmer.id);
      setFarmers((prev) => prev.filter((f) => f.id !== farmer.id));
      showToast(res.message);
    } catch (e) {
      showToast(e.message, 'danger');
    } finally {
      setActionLoading(null);
    }
  }

  function exportCSV() {
    const headers = ['ID', 'Username', 'Full Name', 'Phone', 'Location', 'Acres', 'Crops', 'Revenue (INR)', 'Expenses (INR)', 'Net Profit (INR)', 'Status', 'Joined'];
    const rows = filtered.map((f) => [
      f.id,
      f.username,
      `"${f.full_name}"`,
      f.phone,
      `"${f.location}"`,
      f.total_acres,
      f.crop_count,
      f.total_revenue,
      f.total_expenses,
      f.net_profit,
      f.is_active ? 'Active' : 'Inactive',
      f.joined,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `farmers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const totalFarmers = farmers.length;
  const activeFarmers = farmers.filter((f) => f.is_active).length;
  const totalAcreage = farmers.reduce((sum, f) => sum + (f.total_acres || 0), 0);
  const totalPlatformRevenue = farmers.reduce((sum, f) => sum + (f.total_revenue || 0), 0);

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
            <i className="bi bi-people-fill me-2 text-success"></i>Farmer Governance & Operations
          </h4>
          <small className="text-muted">
            Manage farmer accounts, view agricultural dossiers, land holdings, and account credentials
          </small>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={exportCSV} title="Export to CSV">
            <i className="bi bi-file-earmark-arrow-down me-1"></i>Export CSV
          </button>
          <button className="btn btn-outline-success btn-sm" onClick={loadFarmers} title="Refresh">
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
          <button className="btn btn-success btn-sm d-flex align-items-center gap-1" onClick={() => setShowAddModal(true)}>
            <i className="bi bi-person-plus-fill"></i>
            <span>Onboard Farmer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Registered Farmers</div>
            <div className="fw-bold fs-3 text-dark">{totalFarmers}</div>
            <small className="text-success">{activeFarmers} active accounts</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Managed Land</div>
            <div className="fw-bold fs-3 text-primary">{round(totalAcreage, 1)} Ac</div>
            <small className="text-muted">Total cultivated area</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Total Trade Revenue</div>
            <div className="fw-bold fs-3 text-success">{fmtINR(totalPlatformRevenue)}</div>
            <small className="text-muted">Across all farmers</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Inactive Accounts</div>
            <div className="fw-bold fs-3 text-danger">{totalFarmers - activeFarmers}</div>
            <small className="text-muted">Suspended or pending</small>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2 px-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
          {/* Status Tabs */}
          <div className="btn-group btn-group-sm">
            <button
              className={`btn ${statusFilter === 'ALL' ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('ALL')}
            >
              All ({totalFarmers})
            </button>
            <button
              className={`btn ${statusFilter === 'ACTIVE' ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('ACTIVE')}
            >
              Active ({activeFarmers})
            </button>
            <button
              className={`btn ${statusFilter === 'INACTIVE' ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('INACTIVE')}
            >
              Inactive ({totalFarmers - activeFarmers})
            </button>
          </div>

          {/* Search Input */}
          <div className="input-group" style={{ maxWidth: 350 }}>
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control form-control-sm border-start-0"
              placeholder="Search name, phone, village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setSearch('')}>
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Farmers Data Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success"></div>
              <div className="mt-2 text-muted small">Loading farmers directory...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-person-x fs-1 d-block mb-2 text-secondary"></i>
              {search ? 'No farmers match your filter criteria.' : 'No farmers registered yet.'}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Farmer</th>
                    <th>Phone / Login</th>
                    <th>Village / Location</th>
                    <th className="text-center">Land (Ac)</th>
                    <th className="text-center">Crops</th>
                    <th className="text-end">Revenue</th>
                    <th className="text-end">Expenses</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Joined</th>
                    <th className="text-center" style={{ width: 170 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f) => (
                    <tr key={f.id} style={{ opacity: actionLoading === f.id ? 0.5 : 1 }}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="d-flex align-items-center justify-content-center bg-success-subtle rounded-circle"
                            style={{ width: 34, height: 34, flexShrink: 0 }}
                          >
                            <span className="text-success fw-bold">
                              {f.full_name ? f.full_name.charAt(0).toUpperCase() : 'F'}
                            </span>
                          </div>
                          <div>
                            <div className="fw-semibold text-dark">{f.full_name}</div>
                            <small className="text-muted">@{f.username}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-monospace text-dark">{f.phone}</span>
                      </td>
                      <td>{f.location}</td>
                      <td className="text-center fw-semibold">{f.total_acres}</td>
                      <td className="text-center">
                        <span className="badge bg-primary-subtle text-primary px-2 py-1">
                          {f.crop_count} crops
                        </span>
                      </td>
                      <td className="text-end fw-semibold text-success">{fmtINR(f.total_revenue)}</td>
                      <td className="text-end text-danger">{fmtINR(f.total_expenses)}</td>
                      <td className="text-center">
                        <span
                          className={`badge ${
                            f.is_active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                          }`}
                        >
                          <i className={`bi bi-${f.is_active ? 'check-circle' : 'x-circle'} me-1`}></i>
                          {f.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-center text-muted">{f.joined}</td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          {/* View Dossier */}
                          <button
                            className="btn btn-sm btn-outline-info p-1"
                            style={{ width: 28, height: 28 }}
                            onClick={() => setSelectedDossierId(f.id)}
                            title="View Full Farmer Dossier"
                          >
                            <i className="bi bi-file-earmark-person"></i>
                          </button>

                          {/* Edit Details */}
                          <button
                            className="btn btn-sm btn-outline-primary p-1"
                            style={{ width: 28, height: 28 }}
                            onClick={() => setEditFarmer(f)}
                            title="Edit Profile"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>

                          {/* Reset Password */}
                          <button
                            className="btn btn-sm btn-outline-warning p-1"
                            style={{ width: 28, height: 28 }}
                            onClick={() => setResetPwdFarmer(f)}
                            title="Reset Password"
                          >
                            <i className="bi bi-key"></i>
                          </button>

                          {/* Toggle Active */}
                          <button
                            className={`btn btn-sm ${
                              f.is_active ? 'btn-outline-secondary' : 'btn-outline-success'
                            } p-1`}
                            style={{ width: 28, height: 28 }}
                            onClick={() => handleToggle(f)}
                            disabled={actionLoading === f.id}
                            title={f.is_active ? 'Suspend / Deactivate' : 'Activate'}
                          >
                            <i className={`bi bi-${f.is_active ? 'pause-fill' : 'play-fill'}`}></i>
                          </button>

                          {/* Delete */}
                          <button
                            className="btn btn-sm btn-outline-danger p-1"
                            style={{ width: 28, height: 28 }}
                            onClick={() => setConfirmDelete(f)}
                            disabled={actionLoading === f.id}
                            title="Delete Farmer"
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {filtered.length > 0 && (
          <div className="card-footer bg-white text-muted small py-2 d-flex justify-content-between align-items-center">
            <span>
              Showing {filtered.length} of {farmers.length} farmers
            </span>
            <span className="text-success fw-semibold">
              Platform Total: {fmtINR(totalPlatformRevenue)} Revenue
            </span>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          className="modal d-block"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060, position: 'fixed', inset: 0 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content border-0 shadow-lg text-center p-4">
              <div className="text-danger fs-1 mb-2">
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>
              <h5 className="fw-bold">Delete Farmer Account?</h5>
              <p className="text-muted small">
                Are you sure you want to permanently delete <strong>{confirmDelete.full_name}</strong> (@
                {confirmDelete.username}) and all associated fields, crops, expenses, and harvests? This cannot be
                undone.
              </p>
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(confirmDelete)}>
                  Yes, Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedDossierId && (
        <FarmerDossierModal userId={selectedDossierId} onClose={() => setSelectedDossierId(null)} />
      )}
      {showAddModal && (
        <AddFarmerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(msg) => {
            showToast(msg);
            loadFarmers();
          }}
        />
      )}
      {editFarmer && (
        <EditFarmerModal
          farmer={editFarmer}
          onClose={() => setEditFarmer(null)}
          onSuccess={(msg) => {
            showToast(msg);
            loadFarmers();
          }}
        />
      )}
      {resetPwdFarmer && (
        <ResetPasswordModal
          farmer={resetPwdFarmer}
          onClose={() => setResetPwdFarmer(null)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}
    </div>
  );
}

function round(val, dec) {
  return Number(val || 0).toFixed(dec);
}
