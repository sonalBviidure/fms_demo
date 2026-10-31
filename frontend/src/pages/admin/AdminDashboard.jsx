import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchAdminStats,
  fetchRecentActivity,
  fetchFarmers,
  recalculateAllFinancials,
} from '../../services/adminApi';

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const fmtNum = (n) => Number(n || 0).toLocaleString('en-IN');

function StatCard({ icon, label, value, sub, color, iconBg, linkTo }) {
  const content = (
    <div className="card border-0 shadow-sm h-100 hover-card" style={{ transition: 'transform 0.15s ease' }}>
      <div className="card-body d-flex align-items-center gap-3 p-3">
        <div
          className={`d-flex align-items-center justify-content-center rounded-3 ${iconBg || 'bg-success-subtle'}`}
          style={{ width: 52, height: 52, flexShrink: 0 }}
        >
          <i className={`bi bi-${icon} fs-4 ${color || 'text-success'}`}></i>
        </div>
        <div className="flex-grow-1 min-w-0">
          <div className="fw-bold fs-4 mb-0 text-truncate text-dark">{value}</div>
          <div className="text-muted small text-truncate">{label}</div>
          {sub && <div className={`small ${color || 'text-success'} text-truncate`}>{sub}</div>}
        </div>
      </div>
    </div>
  );

  return linkTo ? (
    <Link to={linkTo} className="text-decoration-none">
      {content}
    </Link>
  ) : (
    content
  );
}

function MiniBar({ label, value, max, color = 'bg-success' }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className="mb-2">
      <div className="d-flex justify-content-between small mb-1">
        <span className="text-truncate" style={{ maxWidth: '60%' }}>
          {label}
        </span>
        <span className="fw-semibold">{fmtNum(value)}</span>
      </div>
      <div className="progress" style={{ height: 6 }}>
        <div className={`progress-bar ${color}`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}

const ACTIVITY_BADGES = {
  farmer_joined: { icon: 'person-plus-fill', color: 'success' },
  crop_added: { icon: 'flower1', color: 'primary' },
  sale: { icon: 'cash-coin', color: 'warning' },
  recommendation: { icon: 'cpu-fill', color: 'info' },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [farmersList, setFarmersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recalculating, setRecalculating] = useState(false);
  const [toast, setToast] = useState(null);
  const [showFarmersReportModal, setShowFarmersReportModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [s, a, f] = await Promise.all([
        fetchAdminStats(),
        fetchRecentActivity(),
        fetchFarmers().catch(() => []),
      ]);
      setStats(s);
      setActivity(a);
      setFarmersList(f || []);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      const res = await recalculateAllFinancials();
      showToast(res.message);
      loadData();
    } catch (e) {
      showToast(e.message, 'danger');
    } finally {
      setRecalculating(false);
    }
  }

  if (loading && !stats) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" style={{ width: 44, height: 44 }}></div>
        <div className="mt-2 text-muted small">Loading real-time operations dashboard...</div>
      </div>
    );
  }

  const s = stats?.summary || {};
  const monthlySubs = stats?.monthly_signups || [];
  const topCrops = stats?.top_crops || [];
  const expCats = stats?.expense_by_category || [];
  const topFarmers = stats?.top_farmers || [];

  const maxSubs = Math.max(...monthlySubs.map((m) => m.count), 1);
  const maxCrops = Math.max(...topCrops.map((c) => c.count), 1);
  const maxExp = Math.max(...expCats.map((e) => parseFloat(e.total)), 1);

  const netColor = (s.net_profit || 0) >= 0 ? 'text-success' : 'text-danger';
  const netIcon = (s.net_profit || 0) >= 0 ? 'graph-up-arrow' : 'graph-down-arrow';

  const systemDateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

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

      {/* Executive Operational Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
            <i className="bi bi-speedometer2 text-success"></i>
            <span>System Operations Dashboard</span>
          </h4>
          <small className="text-muted d-flex align-items-center gap-2 mt-1">
            <i className="bi bi-clock-history text-secondary"></i>
            <span>System Date: <strong>{systemDateStr}</strong></span>
            <span>&middot;</span>
            <span className="text-success fw-semibold">Live Database Feed</span>
          </small>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Generate Farmers Report Button */}
          <button
            className="btn btn-outline-success btn-sm d-flex align-items-center gap-1 shadow-sm fw-semibold"
            onClick={() => setShowFarmersReportModal(true)}
            title="Generate comprehensive summary report for all farmers"
          >
            <i className="bi bi-file-earmark-pdf-fill text-danger"></i>
            <span>Generate Farmers Report</span>
          </button>

          <button
            className="btn btn-outline-primary btn-sm"
            onClick={handleRecalculate}
            disabled={recalculating}
          >
            {recalculating ? (
              <>
                <span className="spinner-border spinner-border-sm me-1"></span>
                <span>Recalculating...</span>
              </>
            ) : (
              <>
                <i className="bi bi-calculator me-1"></i>Recalculate Financials
              </>
            )}
          </button>

          <button className="btn btn-success btn-sm d-flex align-items-center gap-1" onClick={loadData}>
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && <div className="alert alert-warning py-2 small mb-4">{error}</div>}

      {/* Quick Operations Bar */}
      <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="card-body py-2 px-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span className="fw-semibold small text-muted">Core Administrative Shortcuts:</span>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/admin/farmer-lookup" className="btn btn-sm btn-light border d-flex align-items-center gap-1">
              <i className="bi bi-people-fill text-success"></i>
              <span>Farmer Lookup (Dropdown Dossier)</span>
            </Link>
            <Link to="/admin/users" className="btn btn-sm btn-light border d-flex align-items-center gap-1">
              <i className="bi bi-person-gear text-primary"></i>
              <span>Manage User Accounts</span>
            </Link>
            <Link to="/admin/ai-monitoring" className="btn btn-sm btn-light border d-flex align-items-center gap-1">
              <i className="bi bi-cpu-fill text-warning"></i>
              <span>AI Models Status</span>
            </Link>
            <Link to="/admin/system" className="btn btn-sm btn-light border d-flex align-items-center gap-1">
              <i className="bi bi-hdd-network-fill text-secondary"></i>
              <span>System &amp; Database Health</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 8 Dynamic KPI Metric Cards (All Live from Database) */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <StatCard
            icon="people-fill"
            label="Total Registered Farmers"
            value={fmtNum(s.total_farmers)}
            sub={`${s.active_farmers || s.total_farmers} Active Farm Accounts`}
            color="text-success"
            iconBg="bg-success-subtle"
            linkTo="/admin/farmer-lookup"
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard
            icon="grid-3x3-gap-fill"
            label="Total Cultivated Land"
            value={`${s.total_acres || 0} Acres`}
            sub={`${s.total_fields || 0} Registered Parcels`}
            color="text-primary"
            iconBg="bg-primary-subtle"
            linkTo="/admin/farmer-lookup"
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard
            icon="flower1"
            label="Total Crop Cycles"
            value={fmtNum(s.total_crops)}
            sub={`${s.active_crops || 0} Active in Field`}
            color="text-success"
            iconBg="bg-success-subtle"
            linkTo="/admin/farmer-lookup"
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard
            icon="cash-coin"
            label="Platform Trade Turnover"
            value={fmtINR(s.total_revenue)}
            sub={`${s.total_sales_count || 0} Recorded Sales`}
            color="text-success"
            iconBg="bg-success-subtle"
            linkTo="/admin/farmer-lookup"
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard
            icon="receipt"
            label="Cultivation Input Costs"
            value={fmtINR(s.total_expenses)}
            sub="Seeds, fertilizer, labor"
            color="text-danger"
            iconBg="bg-danger-subtle"
            linkTo="/admin/farmer-lookup"
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard
            icon={netIcon}
            label="Net Platform Margin"
            value={fmtINR(s.net_profit)}
            sub="Turnover minus input cost"
            color={netColor}
            iconBg={(s.net_profit || 0) >= 0 ? 'bg-success-subtle' : 'bg-danger-subtle'}
            linkTo="/admin/farmer-lookup"
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard
            icon="box2-fill"
            label="Produce Harvested"
            value={`${fmtNum(s.total_harvest_qty)} Qtl`}
            sub={`${s.harvested_crops || 0} Harvested Batches`}
            color="text-warning"
            iconBg="bg-warning-subtle"
            linkTo="/admin/farmer-lookup"
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard
            icon="cpu-fill"
            label="AI Advisory Queries"
            value={fmtNum(
              (s.total_recommendations || 0) +
                (s.total_yield_predictions || 0) +
                (s.total_profit_predictions || 0)
            )}
            sub="Farmer ML queries served"
            color="text-info"
            iconBg="bg-info-subtle"
            linkTo="/admin/ai-monitoring"
          />
        </div>
      </div>

      {/* Main Grid: Dynamic Analytics & Live Operations Stream */}
      <div className="row g-4">
        {/* Left Column: Analytics Charts */}
        <div className="col-lg-8">
          {/* Monthly Registrations */}
          <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 14 }}>
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <span className="fw-bold text-dark">
                <i className="bi bi-bar-chart-fill me-2 text-success"></i>Farmer Registration Growth Trajectory
              </span>
              <span className="badge bg-success-subtle text-success">+{s.new_farmers_this_month || 0} Enrolled This Month</span>
            </div>
            <div className="card-body">
              {monthlySubs.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-inbox fs-3 d-block mb-1"></i>No signup trajectory recorded yet
                </div>
              ) : (
                <div className="d-flex align-items-end gap-3 px-2 pt-3" style={{ height: 180 }}>
                  {monthlySubs.map((m) => {
                    const h = Math.max(Math.round((m.count / maxSubs) * 140), 12);
                    return (
                      <div key={m.month} className="d-flex flex-column align-items-center flex-grow-1">
                        <small className="text-success fw-bold mb-1" style={{ fontSize: 11 }}>
                          {m.count}
                        </small>
                        <div
                          className="bg-success rounded-top w-100"
                          style={{ height: h, minHeight: 12, maxWidth: 54 }}
                        ></div>
                        <small className="text-muted mt-2 text-center" style={{ fontSize: 10 }}>
                          {m.month}
                        </small>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="row g-4">
            {/* Top Crops */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100 bg-white" style={{ borderRadius: 14 }}>
                <div className="card-header bg-white border-bottom py-3 fw-bold text-dark">
                  <i className="bi bi-flower1 me-2 text-primary"></i>Top Sown Crop Varieties
                </div>
                <div className="card-body">
                  {topCrops.length === 0 ? (
                    <div className="text-center text-muted py-3 small">No crops recorded yet.</div>
                  ) : (
                    topCrops.map((c) => (
                      <MiniBar
                        key={c.crop_name}
                        label={c.crop_name}
                        value={c.count}
                        max={maxCrops}
                        color="bg-primary"
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Expense Categories */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100 bg-white" style={{ borderRadius: 14 }}>
                <div className="card-header bg-white border-bottom py-3 fw-bold text-dark">
                  <i className="bi bi-pie-chart-fill me-2 text-danger"></i>Cultivation Expense Distribution
                </div>
                <div className="card-body">
                  {expCats.length === 0 ? (
                    <div className="text-center text-muted py-3 small">No expenses logged.</div>
                  ) : (
                    expCats.map((e) => (
                      <div key={e.category} className="mb-2">
                        <div className="d-flex justify-content-between small mb-1">
                          <span className="text-truncate" style={{ maxWidth: '60%' }}>
                            {e.category}
                          </span>
                          <span className="fw-semibold text-danger">{fmtINR(e.total)}</span>
                        </div>
                        <div className="progress" style={{ height: 6 }}>
                          <div
                            className="progress-bar bg-danger"
                            style={{
                              width: `${maxExp > 0 ? Math.round((e.total / maxExp) * 100) : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Top Farmers & Live Feed */}
        <div className="col-lg-4">
          {/* Top Producing Farmers */}
          <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 14 }}>
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <span className="fw-bold text-dark">
                <i className="bi bi-trophy-fill me-2 text-warning"></i>Top Producing Farmers
              </span>
              <Link to="/admin/farmer-lookup" className="small text-success text-decoration-none fw-semibold">
                View All &rarr;
              </Link>
            </div>
            <div className="card-body p-0">
              {topFarmers.length === 0 ? (
                <div className="text-center text-muted py-4 small">No sales records logged yet.</div>
              ) : (
                <ul className="list-group list-group-flush small">
                  {topFarmers.map((f, i) => (
                    <li key={f.username} className="list-group-item d-flex align-items-center gap-2 py-2 px-3">
                      <span
                        className="badge bg-warning-subtle text-warning-emphasis rounded-circle p-1"
                        style={{ width: 22, height: 22 }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-grow-1 min-w-0">
                        <div className="fw-semibold text-truncate">{f.name}</div>
                        <small className="text-muted">@{f.username}</small>
                      </div>
                      <span className="fw-bold text-success text-end">{fmtINR(f.revenue)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Real-Time Platform Activity Stream */}
          <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: 14 }}>
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <span className="fw-bold text-dark">
                <i className="bi bi-activity me-2 text-info"></i>Live Platform Operations Audit
              </span>
              <span className="badge bg-light text-secondary border small">Live Stream</span>
            </div>
            <div className="card-body p-0" style={{ maxHeight: 380, overflowY: 'auto' }}>
              {activity.length === 0 ? (
                <div className="text-center text-muted py-4 small">No platform activity recorded yet.</div>
              ) : (
                <div className="list-group list-group-flush small">
                  {activity.slice(0, 8).map((a, i) => {
                    const badge = ACTIVITY_BADGES[a.type] || { icon: 'dot', color: 'secondary' };
                    return (
                      <div key={i} className="list-group-item d-flex align-items-start gap-2 py-2 px-3">
                        <div
                          className={`d-flex align-items-center justify-content-center bg-${badge.color}-subtle text-${badge.color} rounded-circle mt-1 flex-shrink-0`}
                          style={{ width: 26, height: 26, fontSize: 12 }}
                        >
                          <i className={`bi bi-${badge.icon}`}></i>
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <div className="text-dark fw-medium lh-sm">{a.message}</div>
                          <small className="text-muted">{a.time}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── All Farmers Report Modal (Print / Save PDF) ── */}
      {showFarmersReportModal && (
        <div
          className="modal d-block"
          style={{ background: 'rgba(0,0,0,0.65)', zIndex: 1050, position: 'fixed', inset: 0 }}
          onClick={(e) => e.target === e.currentTarget && setShowFarmersReportModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
              <div className="modal-header bg-success text-white py-3">
                <h5 className="modal-title mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-file-earmark-pdf-fill"></i>
                  <span>Official Farmers Summary Report — {systemDateStr}</span>
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setShowFarmersReportModal(false)}></button>
              </div>

              <div className="modal-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3 pb-3 border-bottom">
                  <div>
                    <h5 className="fw-bold mb-1">Farm Management System (FMS) — Registered Farmers Directory</h5>
                    <small className="text-muted">
                      System Date: {systemDateStr} &middot; Total Farmers: {farmersList.length} &middot; Total Acreage: {s.total_acres || 0} Acres
                    </small>
                  </div>
                  <button className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm" onClick={() => window.print()}>
                    <i className="bi bi-printer"></i>
                    <span>Print / Save as PDF</span>
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
                        <th className="text-center">Crops Recorded</th>
                        <th>Member Since</th>
                        <th className="text-center">Account Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {farmersList.map((f, i) => (
                        <tr key={f.id}>
                          <td>{i + 1}</td>
                          <td className="fw-bold text-dark">{f.name || f.username}</td>
                          <td className="font-monospace text-muted">@{f.username}</td>
                          <td>{f.phone || '—'}</td>
                          <td>{f.location || 'Maharashtra'}</td>
                          <td className="text-end fw-bold text-success">{f.total_acres || 0} Acres</td>
                          <td className="text-center">{f.crops_count || 0} Crops</td>
                          <td>{new Date(f.date_joined).toLocaleDateString('en-IN')}</td>
                          <td className="text-center">
                            <span className={`badge ${f.is_active ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger'}`}>
                              {f.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer bg-light py-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowFarmersReportModal(false)}>
                  Close
                </button>
                <button className="btn btn-success btn-sm" onClick={() => window.print()}>
                  <i className="bi bi-download me-1"></i>
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
