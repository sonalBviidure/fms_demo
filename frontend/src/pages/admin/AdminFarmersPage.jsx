import React, { useState, useEffect, useCallback } from 'react';
import { fetchFarmers, toggleFarmer, deleteFarmer } from '../../services/adminApi';

const fmtINR = (n) => `\u20b9${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function AdminFarmersPage() {
  const [farmers, setFarmers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
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

  useEffect(() => { loadFarmers(); }, [loadFarmers]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? farmers.filter(f =>
            f.full_name.toLowerCase().includes(q) ||
            f.username.toLowerCase().includes(q) ||
            (f.phone || '').includes(q) ||
            (f.location || '').toLowerCase().includes(q)
          )
        : farmers
    );
  }, [search, farmers]);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleToggle(farmer) {
    setActionLoading(farmer.id);
    try {
      const res = await toggleFarmer(farmer.id);
      setFarmers(prev => prev.map(f => f.id === farmer.id ? { ...f, is_active: res.is_active } : f));
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
      setFarmers(prev => prev.filter(f => f.id !== farmer.id));
      showToast(res.message);
    } catch (e) {
      showToast(e.message, 'danger');
    } finally {
      setActionLoading(null);
    }
  }

  const totalFarmers = farmers.length;
  const activeFarmers = farmers.filter(f => f.is_active).length;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`alert alert-${toast.type} position-fixed top-0 end-0 m-3 shadow py-2`}
          style={{ zIndex: 9999, minWidth: 280 }}
        >
          <i className={`bi bi-${toast.type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
          {toast.msg}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 9998 }}
        >
          <div className="card border-0 shadow-lg" style={{ maxWidth: 400 }}>
            <div className="card-body p-4 text-center">
              <div className="text-danger fs-1 mb-2">
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>
              <h5 className="fw-bold">Delete Farmer?</h5>
              <p className="text-muted">
                This will permanently delete <strong>{confirmDelete.full_name}</strong> and all their data.
                This cannot be undone.
              </p>
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-0">
            <i className="bi bi-people-fill me-2 text-success"></i>Farmer Management
          </h4>
          <small className="text-muted">
            {activeFarmers} active &middot; {totalFarmers - activeFarmers} inactive &middot; {totalFarmers} total
          </small>
        </div>
        <button className="btn btn-outline-success btn-sm" onClick={loadFarmers}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="row g-3 mb-4">
        <div className="col-4">
          <div className="card border-0 shadow-sm text-center py-3">
            <div className="fw-bold fs-3 text-success">{totalFarmers}</div>
            <div className="small text-muted">Total Registered</div>
          </div>
        </div>
        <div className="col-4">
          <div className="card border-0 shadow-sm text-center py-3">
            <div className="fw-bold fs-3 text-primary">{activeFarmers}</div>
            <div className="small text-muted">Active</div>
          </div>
        </div>
        <div className="col-4">
          <div className="card border-0 shadow-sm text-center py-3">
            <div className="fw-bold fs-3 text-danger">{totalFarmers - activeFarmers}</div>
            <div className="small text-muted">Inactive</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2">
          <div className="input-group">
            <span className="input-group-text bg-transparent border-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-0 shadow-none"
              placeholder="Search by name, username, phone or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="btn btn-link text-muted" onClick={() => setSearch('')}>
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success"></div>
              <div className="mt-2 text-muted small">Loading farmers...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-person-x fs-2 d-block mb-2"></i>
              {search ? 'No farmers match your search.' : 'No farmers registered yet.'}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Farmer</th>
                    <th>Phone</th>
                    <th>Location</th>
                    <th className="text-center">Crops</th>
                    <th className="text-end">Revenue</th>
                    <th className="text-end">Expenses</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Joined</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(f => (
                    <tr key={f.id} style={{ opacity: actionLoading === f.id ? 0.5 : 1 }}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="d-flex align-items-center justify-content-center bg-success-subtle rounded-circle"
                            style={{ width: 36, height: 36, flexShrink: 0 }}
                          >
                            <span className="text-success fw-bold" style={{ fontSize: 14 }}>
                              {f.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="fw-semibold">{f.full_name}</div>
                            <small className="text-muted">@{f.username}</small>
                          </div>
                        </div>
                      </td>
                      <td className="small">{f.phone}</td>
                      <td className="small">{f.location}</td>
                      <td className="text-center">
                        <span className="badge bg-primary-subtle text-primary">{f.crop_count}</span>
                      </td>
                      <td className="text-end fw-semibold text-success small">{fmtINR(f.total_revenue)}</td>
                      <td className="text-end text-danger small">{fmtINR(f.total_expenses)}</td>
                      <td className="text-center">
                        <span className={`badge ${f.is_active ? 'bg-success' : 'bg-danger'}`}>
                          {f.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-center small text-muted">{f.joined}</td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <button
                            className={`btn btn-sm ${f.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => handleToggle(f)}
                            disabled={actionLoading === f.id}
                            title={f.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <i className={`bi bi-${f.is_active ? 'pause-circle' : 'play-circle'}`}></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setConfirmDelete(f)}
                            disabled={actionLoading === f.id}
                            title="Delete farmer"
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
          <div className="card-footer bg-white text-muted small">
            Showing {filtered.length} of {farmers.length} farmers
          </div>
        )}
      </div>
    </div>
  );
}
