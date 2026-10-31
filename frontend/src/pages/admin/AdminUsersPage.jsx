import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchFarmers, toggleFarmer, resetFarmerPassword } from '../../services/adminApi';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, INACTIVE
  const [toast, setToast] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Password reset modal state
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFarmers();
      setUsers(data);
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // Toggle user activation / deactivation
  async function handleToggleStatus(user) {
    const action = user.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} user "${user.name || user.username}"?`)) {
      return;
    }

    setActionLoadingId(user.id);
    try {
      const res = await toggleFarmer(user.id);
      showToast(res.message || `User ${user.username} updated.`);
      await loadUsers();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setActionLoadingId(null);
    }
  }

  // Handle password reset
  async function handleResetPassword(e) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'danger');
      return;
    }

    setResetLoading(true);
    try {
      await resetFarmerPassword(resetModalUser.id, newPassword);
      showToast(`Password successfully updated for ${resetModalUser.name || resetModalUser.username}!`);
      setResetModalUser(null);
      setNewPassword('');
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setResetLoading(false);
    }
  }

  const filtered = users.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.location || '').toLowerCase().includes(search.toLowerCase());

    if (statusFilter === 'ACTIVE') return matchesSearch && u.is_active;
    if (statusFilter === 'INACTIVE') return matchesSearch && !u.is_active;
    return matchesSearch;
  });

  const activeCount = users.filter((u) => u.is_active).length;
  const inactiveCount = users.filter((u) => !u.is_active).length;

  return (
    <div>
      {/* Toast Alert */}
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
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
            <i className="bi bi-person-gear text-success"></i>
            <span>User Management</span>
          </h4>
          <small className="text-muted">
            Search users, monitor account statuses, and activate or deactivate platform access
          </small>
        </div>

        <button className="btn btn-outline-success btn-sm d-flex align-items-center gap-1" onClick={loadUsers}>
          <i className="bi bi-arrow-clockwise"></i>
          <span>Refresh</span>
        </button>
      </div>

      {/* Overview Filter Bar */}
      <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Status Filter Buttons */}
          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className={`btn ${statusFilter === 'ALL' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('ALL')}
            >
              All Users ({users.length})
            </button>
            <button
              type="button"
              className={`btn ${statusFilter === 'ACTIVE' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('ACTIVE')}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              className={`btn ${statusFilter === 'INACTIVE' ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
              onClick={() => setStatusFilter('INACTIVE')}
            >
              Deactivated ({inactiveCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="input-group input-group-sm" style={{ maxWidth: 320 }}>
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search user by name, username, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: 14 }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success"></div>
              <div className="mt-2 text-muted small">Loading user directory...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-person-x fs-2 d-block mb-2 text-secondary"></i>
              No users found matching your search.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>User</th>
                    <th>Contact &amp; Location</th>
                    <th>Land Area</th>
                    <th>Role</th>
                    <th>Account Status</th>
                    <th>Member Since</th>
                    <th className="text-center" style={{ width: 220 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const isBusy = actionLoadingId === u.id;
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="d-flex align-items-center justify-content-center bg-light text-secondary rounded-circle fw-bold"
                              style={{ width: 34, height: 34 }}
                            >
                              {(u.name || u.username || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-bold text-dark">{u.name || u.username}</div>
                              <small className="text-muted font-monospace">@{u.username}</small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div>{u.phone || '—'}</div>
                          <small className="text-muted">{u.location || 'Maharashtra'}</small>
                        </td>

                        <td>
                          <span className="fw-semibold text-success">{u.total_acres || 0} Acres</span>
                        </td>

                        <td>
                          <span className="badge bg-light text-dark border">
                            {u.is_superuser ? 'Super Admin' : 'Farmer'}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              u.is_active
                                ? 'bg-success-subtle text-success border border-success-subtle'
                                : 'bg-danger-subtle text-danger border border-danger-subtle'
                            }`}
                          >
                            {u.is_active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>

                        <td className="text-muted">{new Date(u.date_joined).toLocaleDateString('en-IN')}</td>

                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-1">
                            {/* Activate / Deactivate Toggle Button */}
                            <button
                              className={`btn btn-sm ${u.is_active ? 'btn-outline-danger' : 'btn-outline-success'} py-1 px-2 d-flex align-items-center gap-1`}
                              onClick={() => handleToggleStatus(u)}
                              disabled={isBusy}
                              title={u.is_active ? 'Deactivate user account' : 'Activate user account'}
                            >
                              {isBusy ? (
                                <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }}></span>
                              ) : (
                                <i className={`bi bi-${u.is_active ? 'slash-circle' : 'check2-circle'}`}></i>
                              )}
                              <span>{u.is_active ? 'Deactivate' : 'Activate'}</span>
                            </button>

                            {/* Reset Password Button */}
                            <button
                              className="btn btn-sm btn-outline-secondary py-1 px-2"
                              onClick={() => setResetModalUser(u)}
                              title="Reset user password"
                            >
                              <i className="bi bi-key"></i>
                            </button>

                            {/* View Dossier in Farmer Lookup */}
                            <Link
                              to={`/admin/farmer-lookup?id=${u.id}`}
                              className="btn btn-sm btn-light border py-1 px-2 text-decoration-none"
                              title="Open in Farmer Lookup"
                            >
                              <i className="bi bi-eye"></i>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div
          className="modal d-block"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050, position: 'fixed', inset: 0 }}
          onClick={(e) => e.target === e.currentTarget && setResetModalUser(null)}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
              <div className="modal-header bg-dark text-white py-3">
                <h5 className="modal-title fs-6 mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-key-fill text-warning"></i>
                  <span>Reset Password: {resetModalUser.name || resetModalUser.username}</span>
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setResetModalUser(null)}></button>
              </div>

              <form onSubmit={handleResetPassword}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">New Password *</label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <small className="text-muted">
                    The user will be able to log in with this new password immediately.
                  </small>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setResetModalUser(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={resetLoading}>
                    {resetLoading ? 'Updating...' : 'Set New Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
