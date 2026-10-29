import React, { useState, useEffect, useCallback } from 'react';
import { fetchAdminStats, fetchRecentActivity } from '../../services/adminApi';

const fmtINR = (n) => `\u20b9${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const fmtNum = (n) => Number(n || 0).toLocaleString('en-IN');

function StatCard({ icon, label, value, sub, color, iconBg }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body d-flex align-items-center gap-3 p-3">
        <div
          className={`d-flex align-items-center justify-content-center rounded-3 ${iconBg || 'bg-success-subtle'}`}
          style={{ width: 56, height: 56, flexShrink: 0 }}
        >
          <i className={`bi bi-${icon} fs-4 ${color || 'text-success'}`}></i>
        </div>
        <div className="flex-grow-1 min-w-0">
          <div className="fw-bold fs-4 mb-0 text-truncate">{value}</div>
          <div className="text-muted small">{label}</div>
          {sub && <div className={`small ${color || 'text-success'}`}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-2">
      <div className="d-flex justify-content-between small mb-1">
        <span className="text-truncate" style={{ maxWidth: '60%' }}>{label}</span>
        <span className="fw-semibold">{fmtNum(value)}</span>
      </div>
      <div className="progress" style={{ height: 6 }}>
        <div className={`progress-bar ${color || 'bg-success'}`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}

const ACTIVITY_COLORS = {
  farmer_joined: 'success',
  crop_added: 'primary',
  sale: 'warning',
  recommendation: 'info',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadData = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([fetchAdminStats(), fetchRecentActivity()]);
      setStats(s);
      setActivity(a);
      setLastRefresh(new Date());
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

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-success" style={{ width: 48, height: 48 }}></div>
      <div className="mt-3 text-muted">Loading dashboard data...</div>
    </div>
  );

  const s = stats?.summary || {};
  const monthlySubs = stats?.monthly_signups || [];
  const topCrops = stats?.top_crops || [];
  const expCats = stats?.expense_by_category || [];
  const topFarmers = stats?.top_farmers || [];

  const maxSubs = Math.max(...monthlySubs.map(m => m.count), 1);
  const maxCrops = Math.max(...topCrops.map(c => c.count), 1);
  const maxExp = Math.max(...expCats.map(e => parseFloat(e.total)), 1);
  const maxRev = Math.max(...topFarmers.map(f => f.revenue), 1);

  const netColor = (s.net_profit || 0) >= 0 ? 'text-success' : 'text-danger';
  const netIcon = (s.net_profit || 0) >= 0 ? 'graph-up-arrow' : 'graph-down-arrow';

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">
            <i className="bi bi-speedometer2 me-2 text-success"></i>Admin Dashboard
          </h4>
          <small className="text-muted">
            Platform overview &middot; Last refreshed: {lastRefresh.toLocaleTimeString()}
          </small>
        </div>
        <button className="btn btn-outline-success btn-sm" onClick={loadData}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-warning py-2 small">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard
            icon="people-fill"
            label="Total Farmers"
            value={fmtNum(s.total_farmers)}
            sub={`+${s.new_farmers_this_month} this month`}
            color="text-success"
            iconBg="bg-success-subtle"
          />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard
            icon="flower1"
            label="Total Crops"
            value={fmtNum(s.total_crops)}
            sub={`${s.active_crops} active`}
            color="text-primary"
            iconBg="bg-primary-subtle"
          />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard icon="cash-stack" label="Total Revenue" value={fmtINR(s.total_revenue)} color="text-success" iconBg="bg-success-subtle" />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard icon="receipt" label="Total Expenses" value={fmtINR(s.total_expenses)} color="text-danger" iconBg="bg-danger-subtle" />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard
            icon={netIcon}
            label="Net Profit"
            value={fmtINR(Math.abs(s.net_profit || 0))}
            color={netColor}
            iconBg={(s.net_profit || 0) >= 0 ? 'bg-success-subtle' : 'bg-danger-subtle'}
          />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard
            icon="cpu"
            label="AI Queries"
            value={fmtNum((s.total_recommendations || 0) + (s.total_yield_predictions || 0))}
            color="text-info"
            iconBg="bg-info-subtle"
          />
        </div>
      </div>

      <div className="row g-4">
        {/* Charts Column */}
        <div className="col-lg-8">

          {/* Monthly Signups Chart */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-bar-chart-fill me-2 text-success"></i>Farmer Registrations &mdash; Last 6 Months
              </h6>
              {monthlySubs.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-inbox fs-3 d-block mb-2"></i>No signup data yet
                </div>
              ) : (
                <div className="d-flex align-items-end gap-3 px-2" style={{ height: 180 }}>
                  {monthlySubs.map((m) => {
                    const h = Math.max(Math.round((m.count / maxSubs) * 150), 8);
                    return (
                      <div key={m.month} className="d-flex flex-column align-items-center flex-grow-1">
                        <small className="text-success fw-bold mb-1" style={{ fontSize: 11 }}>{m.count}</small>
                        <div
                          className="bg-success rounded-top w-100"
                          style={{ height: h, minHeight: 8, maxWidth: 60 }}
                        ></div>
                        <small className="text-muted mt-1 text-center" style={{ fontSize: 10 }}>{m.month}</small>
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
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">
                    <i className="bi bi-flower1 me-2 text-primary"></i>Top 5 Crops
                  </h6>
                  {topCrops.length === 0 ? (
                    <div className="text-center text-muted py-3">
                      <i className="bi bi-inbox fs-4 d-block mb-1"></i>No crop data
                    </div>
                  ) : (
                    topCrops.map(c => (
                      <MiniBar key={c.crop_name} label={c.crop_name} value={c.count} max={maxCrops} color="bg-primary" />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Expense by Category */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">
                    <i className="bi bi-pie-chart-fill me-2 text-danger"></i>Expenses by Category
                  </h6>
                  {expCats.length === 0 ? (
                    <div className="text-center text-muted py-3">
                      <i className="bi bi-inbox fs-4 d-block mb-1"></i>No expense data
                    </div>
                  ) : (
                    expCats.map(e => (
                      <MiniBar
                        key={e.category}
                        label={e.category || 'Other'}
                        value={parseFloat(e.total)}
                        max={maxExp}
                        color="bg-danger"
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Top Farmers by Revenue */}
          <div className="card border-0 shadow-sm mt-4">
            <div className="card-header bg-white border-bottom fw-bold">
              <i className="bi bi-trophy-fill me-2 text-warning"></i>Top Farmers by Revenue
            </div>
            <div className="card-body p-0">
              {topFarmers.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-inbox fs-3 d-block mb-2"></i>No sales data yet
                </div>
              ) : (
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th>Farmer</th>
                      <th className="text-end">Revenue</th>
                      <th>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topFarmers.map((f, i) => (
                      <tr key={f.username}>
                        <td>
                          {i === 0 ? <span className="badge bg-warning text-dark">\uD83E\uDD47</span>
                            : i === 1 ? <span className="badge bg-secondary">\uD83E\uDD48</span>
                            : i === 2 ? <span className="badge bg-warning-subtle text-warning">\uD83E\uDD49</span>
                            : <span className="text-muted">{i + 1}</span>}
                        </td>
                        <td>
                          <div className="fw-semibold">{f.name}</div>
                          <small className="text-muted">@{f.username}</small>
                        </td>
                        <td className="text-end fw-bold text-success">{fmtINR(f.revenue)}</td>
                        <td style={{ width: 120 }}>
                          <div className="progress" style={{ height: 6 }}>
                            <div
                              className="progress-bar bg-success"
                              style={{ width: `${(f.revenue / maxRev) * 100}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm" style={{ position: 'sticky', top: 20 }}>
            <div className="card-header bg-white border-bottom d-flex align-items-center">
              <span className="fw-bold">
                <i className="bi bi-activity me-2 text-info"></i>Recent Activity
              </span>
              <span className="badge bg-info-subtle text-info ms-auto">{activity.length}</span>
            </div>
            <div className="card-body p-0" style={{ maxHeight: 520, overflowY: 'auto' }}>
              {activity.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-inbox fs-3 d-block mb-2"></i>No activity yet
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {activity.map((a, i) => (
                    <div key={i} className="list-group-item px-3 py-2">
                      <div className="d-flex gap-2 align-items-start">
                        <div
                          className={`d-flex align-items-center justify-content-center rounded-circle bg-${ACTIVITY_COLORS[a.type] || 'secondary'}-subtle`}
                          style={{ width: 32, height: 32, flexShrink: 0 }}
                        >
                          <i className={`bi bi-${a.icon} text-${ACTIVITY_COLORS[a.type] || 'secondary'} small`}></i>
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <div className="small text-dark">{a.message}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>{a.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
