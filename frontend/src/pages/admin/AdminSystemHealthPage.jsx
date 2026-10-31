import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchSystemHealth,
  recalculateAllFinancials,
  seedDemoData,
} from '../../services/adminApi';

export default function AdminSystemHealthPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const loadHealth = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSystemHealth();
      setHealth(data);
    } catch (e) {
      showToast(e.message, 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleRecalculate() {
    setActionLoading(true);
    try {
      const res = await recalculateAllFinancials();
      showToast(res.message);
      loadHealth();
    } catch (e) {
      showToast(e.message, 'danger');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSeed() {
    setActionLoading(true);
    try {
      const res = await seedDemoData();
      showToast(res.message);
      loadHealth();
    } catch (e) {
      showToast(e.message, 'danger');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading && !health) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" style={{ width: 44, height: 44 }}></div>
        <div className="mt-2 text-muted small">Performing system diagnostics...</div>
      </div>
    );
  }

  const db = health?.database || {};
  const env = health?.environment || {};
  const tables = health?.table_counts || {};

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
            <i className="bi bi-heart-pulse-fill me-2 text-danger"></i>System Health & Infrastructure Diagnostics
          </h4>
          <small className="text-muted">
            Live database telemetry, table row counts, server environment, and maintenance operations
          </small>
        </div>

        <button className="btn btn-outline-success btn-sm" onClick={loadHealth} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh Diagnostics
        </button>
      </div>

      {/* Primary Status Banner */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className={`d-flex align-items-center justify-content-center rounded-circle ${
                health?.status === 'Healthy' ? 'bg-success text-white' : 'bg-warning text-dark'
              }`}
              style={{ width: 56, height: 56, fontSize: 24 }}
            >
              <i className={`bi bi-${health?.status === 'Healthy' ? 'shield-check' : 'exclamation-triangle'}`}></i>
            </div>
            <div>
              <h5 className="fw-bold mb-0 text-dark">
                Platform Status: <span className="text-success">{health?.status}</span>
              </h5>
              <div className="text-muted small">
                MySQL Database responding with {db.latency_ms} ms ping latency &middot; All API services active
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={handleRecalculate}
              disabled={actionLoading}
            >
              <i className="bi bi-calculator me-1"></i>Recalculate All Financials
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={handleSeed}
              disabled={actionLoading}
            >
              <i className="bi bi-database-fill-gear me-1"></i>Re-seed Sample Data
            </button>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Database Metrics */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white fw-bold py-3">
              <i className="bi bi-database me-2 text-primary"></i>Database Connection & Engine
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush small">
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span className="text-muted">Connection State</span>
                  <span className="badge bg-success-subtle text-success">
                    <i className="bi bi-circle-fill me-1" style={{ fontSize: 7 }}></i>Connected
                  </span>
                </li>
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span className="text-muted">Database Engine</span>
                  <span className="fw-semibold text-dark font-monospace">{db.engine?.toUpperCase()}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span className="text-muted">Database Schema Name</span>
                  <span className="fw-semibold text-dark font-monospace">{db.name}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span className="text-muted">Connection Latency</span>
                  <span className="fw-bold text-success">{db.latency_ms} ms</span>
                </li>
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span className="text-muted">Timezone Support</span>
                  <span className="text-dark">UTC Active</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Server Environment */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white fw-bold py-3">
              <i className="bi bi-hdd-network me-2 text-success"></i>Application Environment
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush small">
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span className="text-muted">Python Version</span>
                  <span className="font-monospace text-dark">{env.python_version}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span className="text-muted">Django Version</span>
                  <span className="font-monospace text-dark">Django {env.django_version}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span className="text-muted">Server Timezone</span>
                  <span className="text-dark">{env.server_timezone}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span className="text-muted">Server Timestamp</span>
                  <span className="text-dark">{env.server_time}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between py-2">
                  <span className="text-muted">Debug Mode</span>
                  <span className={`badge ${env.debug_mode ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'}`}>
                    {env.debug_mode ? 'Enabled (Dev)' : 'Disabled (Production)'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Database Tables Statistics */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white fw-bold py-3">
          <i className="bi bi-table me-2 text-dark"></i>Platform Database Entity Volumes ({Object.keys(tables).length} Models)
        </div>
        <div className="card-body p-4">
          <div className="row g-3">
            {Object.entries(tables).map(([tbl, count]) => (
              <div key={tbl} className="col-6 col-md-4 col-xl-3">
                <div className="p-3 border rounded-3 bg-light">
                  <div className="text-muted small text-truncate">{tbl}</div>
                  <div className="fw-bold fs-4 text-dark">{count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
