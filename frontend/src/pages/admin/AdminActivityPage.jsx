import React, { useState, useEffect, useCallback } from 'react';
import { fetchRecentActivity } from '../../services/adminApi';

// Colour mapping by activity type
const TYPE_META = {
  farmer_joined:  { color: 'success', icon: 'person-plus',  label: 'Farmer Joins' },
  crop_added:     { color: 'primary', icon: 'flower1',       label: 'Crops Added'  },
  sale:           { color: 'warning', icon: 'cash-coin',     label: 'Sales'        },
  recommendation: { color: 'info',    icon: 'cpu',           label: 'AI Queries'   },
};

// Currency formatter (not used in activity but kept for consistency)
const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

function SummaryCard({ type, count }) {
  const meta = TYPE_META[type] || { color: 'secondary', icon: 'activity', label: type };
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body d-flex align-items-center gap-3 p-3">
        <div
          className={`d-flex align-items-center justify-content-center rounded-3 bg-${meta.color}-subtle`}
          style={{ width: 52, height: 52, flexShrink: 0 }}
        >
          <i className={`bi bi-${meta.icon} fs-4 text-${meta.color}`}></i>
        </div>
        <div>
          <div className="fw-bold fs-3 mb-0">{count}</div>
          <div className="text-muted small">{meta.label}</div>
        </div>
      </div>
    </div>
  );
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRecentActivity();
      setActivities(data);
      setLastRefresh(new Date());
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + auto-refresh every 30 seconds
  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  // Count each type from the activity array
  const counts = activities.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* Page header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">
            <i className="bi bi-activity me-2 text-info"></i>Activity Feed
          </h4>
          <small className="text-muted">
            Platform-wide events &middot; Last refreshed: {lastRefresh.toLocaleTimeString()}
            &nbsp;&middot;&nbsp;
            <span className="text-info">Auto-refreshing every 30s</span>
          </small>
        </div>
        <button className="btn btn-outline-info btn-sm" onClick={load} disabled={loading}>
          <i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spin' : ''}`}></i>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="alert alert-warning py-2 small mb-3">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
        </div>
      )}

      {/* Summary cards */}
      <div className="row g-3 mb-4">
        {Object.keys(TYPE_META).map(type => (
          <div key={type} className="col-6 col-md-3">
            <SummaryCard type={type} count={counts[type] || 0} />
          </div>
        ))}
      </div>

      {/* Activity list */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom d-flex align-items-center">
          <span className="fw-bold">
            <i className="bi bi-list-ul me-2 text-info"></i>Recent Events
          </span>
          <span className="badge bg-info-subtle text-info ms-auto">
            {activities.length} events
          </span>
        </div>

        <div className="card-body p-0">
          {loading && activities.length === 0 ? (
            <div className="text-center py-5">
              <div className="spinner-border text-info" style={{ width: 40, height: 40 }}></div>
              <div className="mt-3 text-muted small">Loading activity feed…</div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-inbox fs-2 d-block mb-2"></i>
              No activity recorded yet
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {activities.map((a, i) => {
                const meta = TYPE_META[a.type] || { color: 'secondary', icon: 'activity' };
                return (
                  <div key={i} className="list-group-item px-4 py-3">
                    <div className="d-flex gap-3 align-items-start">
                      {/* Icon bubble */}
                      <div
                        className={`d-flex align-items-center justify-content-center rounded-circle bg-${meta.color}-subtle flex-shrink-0`}
                        style={{ width: 40, height: 40, marginTop: 2 }}
                      >
                        <i className={`bi bi-${a.icon || meta.icon} text-${meta.color}`}></i>
                      </div>

                      {/* Message */}
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="text-dark">{a.message}</span>
                          <span className={`badge bg-${meta.color}-subtle text-${meta.color} text-capitalize`}>
                            {TYPE_META[a.type]?.label || a.type}
                          </span>
                        </div>
                        <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                          <i className="bi bi-clock me-1"></i>{a.time}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {activities.length > 0 && (
          <div className="card-footer bg-white text-center text-muted small py-2">
            Showing {activities.length} most recent events
          </div>
        )}
      </div>

      {/* Inline spin style */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { display: inline-block; animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
