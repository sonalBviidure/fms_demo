import React, { useState, useEffect, useCallback } from 'react';
import { fetchFarmers, fetchFarmerReport, fetchPlatformReport } from '../../services/adminApi';

// ─── Formatters ─────────────────────────────────────────────────────────────
const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const fmtNum = (n) => Number(n || 0).toLocaleString('en-IN');

// ─── Mini progress bar for expense breakdown ─────────────────────────────────
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

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color = 'text-success', iconBg = 'bg-success-subtle' }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body d-flex align-items-center gap-3 p-3">
        <div
          className={`d-flex align-items-center justify-content-center rounded-3 ${iconBg}`}
          style={{ width: 52, height: 52, flexShrink: 0 }}
        >
          <i className={`bi bi-${icon} fs-4 ${color}`}></i>
        </div>
        <div className="flex-grow-1 min-w-0">
          <div className="fw-bold fs-5 mb-0 text-truncate">{value}</div>
          <div className="text-muted small">{label}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Farmer detail modal ─────────────────────────────────────────────────────
function FarmerDetailModal({ userId, onClose }) {
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

  const farmer  = report?.farmer  || {};
  const summary = report?.summary || {};
  const crops   = report?.crops   || [];
  const expBreakdown = report?.expense_breakdown || [];
  const maxExp  = Math.max(...expBreakdown.map(e => e.amount), 1);
  const netColor = (summary.net_profit || 0) >= 0 ? 'text-success' : 'text-danger';

  return (
    <div
      className="modal d-block"
      style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050, position: 'fixed', inset: 0, overflowY: 'auto' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-dialog modal-xl modal-dialog-scrollable my-4" style={{ maxWidth: 900 }}>
        <div className="modal-content border-0 shadow-lg">

          {/* Header */}
          <div
            className="modal-header text-white"
            style={{ background: 'linear-gradient(135deg, #1a3c2e, #2d6a4f)' }}
          >
            <div>
              <h5 className="modal-title mb-0">
                <i className="bi bi-person-badge me-2"></i>
                Farmer Report — {farmer.full_name || '…'}
              </h5>
              <small style={{ opacity: 0.75 }}>@{farmer.username}</small>
            </div>
            <button className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" style={{ width: 40, height: 40 }}></div>
                <div className="mt-3 text-muted small">Loading report…</div>
              </div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : (
              <>
                {/* Farmer Info */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="card border-0 bg-light h-100">
                      <div className="card-body">
                        <h6 className="fw-bold mb-3">
                          <i className="bi bi-person-circle me-2 text-success"></i>Farmer Info
                        </h6>
                        <table className="table table-sm table-borderless mb-0">
                          <tbody>
                            <tr><td className="text-muted" style={{ width: 120 }}>Name</td><td className="fw-semibold">{farmer.full_name}</td></tr>
                            <tr><td className="text-muted">Username</td><td>@{farmer.username}</td></tr>
                            <tr><td className="text-muted">Phone</td><td>{farmer.phone || '—'}</td></tr>
                            <tr><td className="text-muted">Location</td><td>{farmer.location || '—'}</td></tr>
                            <tr><td className="text-muted">Total Acres</td><td>{fmtNum(farmer.total_acres)} acres</td></tr>
                            <tr><td className="text-muted">Joined</td><td>{farmer.joined}</td></tr>
                            <tr>
                              <td className="text-muted">Status</td>
                              <td>
                                <span className={`badge ${farmer.is_active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                  {farmer.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="card border-0 bg-light h-100">
                      <div className="card-body">
                        <h6 className="fw-bold mb-3">
                          <i className="bi bi-bar-chart-fill me-2 text-primary"></i>Crop Summary
                        </h6>
                        <div className="row g-2">
                          {[
                            { label: 'Total Crops',     val: summary.total_crops,     color: 'primary' },
                            { label: 'Active',          val: summary.active_crops,    color: 'success' },
                            { label: 'Harvested',       val: summary.harvested_crops, color: 'warning' },
                            { label: 'Total Fields',    val: summary.total_fields,    color: 'info' },
                          ].map(item => (
                            <div key={item.label} className="col-6">
                              <div className={`rounded-3 p-2 bg-${item.color}-subtle text-center`}>
                                <div className={`fw-bold fs-5 text-${item.color}`}>{item.val ?? 0}</div>
                                <div className="text-muted" style={{ fontSize: 11 }}>{item.label}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="row g-3 mb-4">
                  {[
                    { icon: 'cash-stack',      label: 'Total Revenue',   value: fmtINR(summary.total_revenue),  color: 'text-success', bg: 'bg-success-subtle' },
                    { icon: 'receipt',         label: 'Total Expenses',  value: fmtINR(summary.total_expenses), color: 'text-danger',  bg: 'bg-danger-subtle'  },
                    { icon: 'graph-up-arrow',  label: 'Net Profit',      value: fmtINR(summary.net_profit),     color: netColor,        bg: (summary.net_profit || 0) >= 0 ? 'bg-success-subtle' : 'bg-danger-subtle' },
                    { icon: 'currency-rupee',  label: 'Profit / Acre',   value: fmtINR(summary.profit_per_acre), color: netColor,       bg: 'bg-warning-subtle'  },
                  ].map(c => (
                    <div key={c.label} className="col-6 col-md-3">
                      <StatCard icon={c.icon} label={c.label} value={c.value} color={c.color} iconBg={c.bg} />
                    </div>
                  ))}
                </div>

                {/* Expense Breakdown */}
                {expBreakdown.length > 0 && (
                  <div className="card border-0 bg-light mb-4">
                    <div className="card-body">
                      <h6 className="fw-bold mb-3">
                        <i className="bi bi-pie-chart-fill me-2 text-danger"></i>Expense Breakdown
                      </h6>
                      {expBreakdown.map(e => (
                        <MiniBar key={e.category} label={e.category} value={e.amount} max={maxExp} color="bg-danger" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Crops Table */}
                {crops.length > 0 && (
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-bottom fw-bold">
                      <i className="bi bi-flower1 me-2 text-primary"></i>Recent Crops
                    </div>
                    <div className="table-responsive">
                      <table className="table table-hover mb-0 small">
                        <thead className="table-light">
                          <tr>
                            <th>Crop</th>
                            <th>Season</th>
                            <th>Field</th>
                            <th>Status</th>
                            <th className="text-end">Expenses</th>
                            <th className="text-end">Revenue</th>
                            <th className="text-end">Profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {crops.map(c => {
                            const profitColor = c.profit >= 0 ? 'text-success' : 'text-danger';
                            const statusColors = { Sown: 'primary', Growing: 'success', Harvested: 'warning', Closed: 'secondary' };
                            return (
                              <tr key={c.id}>
                                <td>
                                  <div className="fw-semibold">{c.crop_name}</div>
                                  {c.variety && <small className="text-muted">{c.variety}</small>}
                                </td>
                                <td>{c.season}</td>
                                <td>{c.field_name}</td>
                                <td>
                                  <span className={`badge bg-${statusColors[c.status] || 'secondary'}-subtle text-${statusColors[c.status] || 'secondary'}`}>
                                    {c.status}
                                  </span>
                                </td>
                                <td className="text-end text-danger">{fmtINR(c.total_expenses)}</td>
                                <td className="text-end text-success">{fmtINR(c.total_revenue)}</td>
                                <td className={`text-end fw-semibold ${profitColor}`}>{fmtINR(c.profit)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer bg-light">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              <i className="bi bi-x-lg me-1"></i>Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AdminReportsPage() {
  const [platformReport, setPlatformReport] = useState(null);
  const [farmers, setFarmers]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [search, setSearch]                 = useState('');
  const [selectedId, setSelectedId]         = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [report, fList] = await Promise.all([fetchPlatformReport(), fetchFarmers()]);
      setPlatformReport(report);
      setFarmers(fList);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter farmers by search term
  const filtered = farmers.filter(f => {
    const q = search.toLowerCase();
    return (
      f.full_name.toLowerCase().includes(q) ||
      f.username.toLowerCase().includes(q) ||
      (f.phone || '').toLowerCase().includes(q) ||
      (f.location || '').toLowerCase().includes(q)
    );
  });

  // CSV export
  function exportCSV() {
    const headers = ['Name', 'Username', 'Phone', 'Location', 'Acres', 'Crops', 'Revenue', 'Expenses', 'Net Profit', 'Status', 'Joined'];
    const rows = farmers.map(f => [
      f.full_name, f.username, f.phone, f.location,
      f.total_acres, f.crop_count,
      f.total_revenue, f.total_expenses, f.net_profit,
      f.is_active ? 'Active' : 'Inactive', f.joined,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'fms_farmers_report.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const s   = platformReport?.summary || {};
  const seasons = platformReport?.crop_season_breakdown || [];
  const expBreakdown = platformReport?.expense_breakdown || [];
  const maxExp = Math.max(...expBreakdown.map(e => e.total), 1);
  const netColor = (s.net_profit || 0) >= 0 ? 'text-success' : 'text-danger';

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">
            <i className="bi bi-file-earmark-bar-graph me-2 text-success"></i>Platform Reports
          </h4>
          <small className="text-muted">Comprehensive analytics for the entire platform</small>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-success btn-sm" onClick={load} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
          <button className="btn btn-success btn-sm" onClick={exportCSV} disabled={farmers.length === 0}>
            <i className="bi bi-download me-1"></i>Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning py-2 small mb-3">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" style={{ width: 48, height: 48 }}></div>
          <div className="mt-3 text-muted">Loading platform report…</div>
        </div>
      ) : (
        <>
          {/* ── Platform Summary Cards ── */}
          <div className="row g-3 mb-4">
            {[
              { icon: 'people-fill',    label: 'Total Farmers',   value: fmtNum(s.total_farmers),   color: 'text-success', bg: 'bg-success-subtle' },
              { icon: 'person-check',   label: 'Active Farmers',  value: fmtNum(s.active_farmers),  color: 'text-primary', bg: 'bg-primary-subtle' },
              { icon: 'flower1',        label: 'Total Crops',     value: fmtNum(s.total_crops),     color: 'text-primary', bg: 'bg-primary-subtle' },
              { icon: 'diagram-3',      label: 'Total Fields',    value: fmtNum(s.total_fields),    color: 'text-info',    bg: 'bg-info-subtle'    },
              { icon: 'cash-stack',     label: 'Total Revenue',   value: fmtINR(s.total_revenue),   color: 'text-success', bg: 'bg-success-subtle' },
              { icon: 'receipt',        label: 'Total Expenses',  value: fmtINR(s.total_expenses),  color: 'text-danger',  bg: 'bg-danger-subtle'  },
              { icon: 'graph-up-arrow', label: 'Net Profit',      value: fmtINR(s.net_profit),      color: netColor,        bg: (s.net_profit || 0) >= 0 ? 'bg-success-subtle' : 'bg-danger-subtle' },
              { icon: 'cpu',            label: 'AI Queries',      value: fmtNum((s.total_recommendations || 0) + (s.total_yield_predictions || 0)), color: 'text-info', bg: 'bg-info-subtle' },
            ].map(c => (
              <div key={c.label} className="col-6 col-md-3 col-xl-3">
                <StatCard icon={c.icon} label={c.label} value={c.value} color={c.color} iconBg={c.bg} />
              </div>
            ))}
          </div>

          {/* ── Season Breakdown + Expense Breakdown ── */}
          <div className="row g-4 mb-4">
            {/* Season breakdown table */}
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-bottom fw-bold">
                  <i className="bi bi-calendar3 me-2 text-success"></i>Crop Season Breakdown
                </div>
                <div className="table-responsive">
                  <table className="table table-hover mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Season</th>
                        <th className="text-center">Crops</th>
                        <th className="text-end">Revenue</th>
                        <th className="text-end">Expenses</th>
                        <th className="text-end">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seasons.length === 0 ? (
                        <tr><td colSpan={5} className="text-center text-muted py-4">No season data</td></tr>
                      ) : seasons.map(row => {
                        const pc = row.profit >= 0 ? 'text-success' : 'text-danger';
                        return (
                          <tr key={row.season}>
                            <td className="fw-semibold">{row.season}</td>
                            <td className="text-center">{fmtNum(row.crop_count)}</td>
                            <td className="text-end text-success">{fmtINR(row.revenue)}</td>
                            <td className="text-end text-danger">{fmtINR(row.expenses)}</td>
                            <td className={`text-end fw-bold ${pc}`}>{fmtINR(row.profit)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Expense breakdown bars */}
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-bottom fw-bold">
                  <i className="bi bi-pie-chart-fill me-2 text-danger"></i>Expenses by Category
                </div>
                <div className="card-body">
                  {expBreakdown.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-inbox fs-3 d-block mb-2"></i>No expense data
                    </div>
                  ) : (
                    expBreakdown.map(e => (
                      <MiniBar key={e.category} label={e.category} value={e.total} max={maxExp} color="bg-danger" />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Farmer Reports Table ── */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom d-flex align-items-center gap-3 flex-wrap">
              <span className="fw-bold">
                <i className="bi bi-people me-2 text-success"></i>Farmer Reports
              </span>
              <div className="ms-auto d-flex gap-2">
                <div className="input-group input-group-sm" style={{ width: 250 }}>
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, location, phone…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  {search && (
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setSearch('')}>
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
                <span className="badge bg-secondary-subtle text-secondary align-self-center">
                  {filtered.length} farmers
                </span>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Farmer</th>
                    <th>Phone</th>
                    <th>Location</th>
                    <th className="text-center">Acres</th>
                    <th className="text-center">Crops</th>
                    <th className="text-end">Revenue</th>
                    <th className="text-end">Expenses</th>
                    <th className="text-end">Profit</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center text-muted py-4">
                        <i className="bi bi-search me-2"></i>No farmers match your search
                      </td>
                    </tr>
                  ) : filtered.map(f => {
                    const profitColor = f.net_profit >= 0 ? 'text-success' : 'text-danger';
                    return (
                      <tr key={f.id}>
                        <td>
                          <div className="fw-semibold">{f.full_name}</div>
                          <small className="text-muted">@{f.username}</small>
                        </td>
                        <td>{f.phone || '—'}</td>
                        <td>{f.location || '—'}</td>
                        <td className="text-center">{fmtNum(f.total_acres)}</td>
                        <td className="text-center">{f.crop_count}</td>
                        <td className="text-end text-success">{fmtINR(f.total_revenue)}</td>
                        <td className="text-end text-danger">{fmtINR(f.total_expenses)}</td>
                        <td className={`text-end fw-semibold ${profitColor}`}>{fmtINR(f.net_profit)}</td>
                        <td className="text-center">
                          <span className={`badge ${f.is_active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                            {f.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-outline-success btn-sm"
                            title="View detailed report"
                            onClick={() => setSelectedId(f.id)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Farmer Detail Modal */}
      {selectedId !== null && (
        <FarmerDetailModal userId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
