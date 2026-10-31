import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchAnnouncements,
  createAnnouncement,
  toggleAnnouncement,
  deleteAnnouncement,
} from '../../services/adminApi';

const PRIORITY_BADGES = {
  info: { label: 'Information', bg: 'bg-info-subtle', text: 'text-info', icon: 'info-circle-fill' },
  warning: { label: 'Weather / Advisory', bg: 'bg-warning-subtle', text: 'text-warning-emphasis', icon: 'exclamation-triangle-fill' },
  danger: { label: 'Pest / Critical Alert', bg: 'bg-danger-subtle', text: 'text-danger', icon: 'shield-slash-fill' },
  success: { label: 'Subsidy / Scheme Notice', bg: 'bg-success-subtle', text: 'text-success', icon: 'check-circle-fill' },
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAnnouncements();
      setAnnouncements(data);
    } catch (e) {
      showToast(e.message, 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleToggle(ann) {
    try {
      const res = await toggleAnnouncement(ann.id, !ann.is_active);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === ann.id ? { ...a, is_active: res.is_active } : a))
      );
      showToast(res.message);
    } catch (e) {
      showToast(e.message, 'danger');
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      const res = await deleteAnnouncement(confirmDelete.id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== confirmDelete.id));
      showToast(res.message);
      setConfirmDelete(null);
    } catch (e) {
      showToast(e.message, 'danger');
    }
  }

  const activeCount = announcements.filter((a) => a.is_active).length;
  const criticalCount = announcements.filter((a) => a.priority === 'danger').length;

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
            <i className="bi bi-megaphone-fill me-2 text-success"></i>System Broadcasts & Farmer Advisories
          </h4>
          <small className="text-muted">
            Publish weather warnings, pest outbreak alerts, and government subsidy updates to all farmers
          </small>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-success btn-sm" onClick={loadAnnouncements}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
          <button className="btn btn-success btn-sm d-flex align-items-center gap-1" onClick={() => setShowAddModal(true)}>
            <i className="bi bi-broadcast"></i>
            <span>Publish Broadcast</span>
          </button>
        </div>
      </div>

      {/* Overview Counters */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Total Announcements</div>
            <div className="fw-bold fs-3 text-dark">{announcements.length}</div>
            <small className="text-muted">Platform advisories</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Active Broadcasts</div>
            <div className="fw-bold fs-3 text-success">{activeCount}</div>
            <small className="text-muted">Currently live to farmers</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Critical Alerts</div>
            <div className="fw-bold fs-3 text-danger">{criticalCount}</div>
            <small className="text-muted">Pest / severe weather</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Broadcast Target</div>
            <div className="fw-bold fs-3 text-primary">All Farmers</div>
            <small className="text-muted">Portal banner & mobile feed</small>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success"></div>
              <div className="mt-2 text-muted small">Loading announcements...</div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-megaphone fs-1 d-block mb-2 text-secondary"></i>
              No broadcasts published yet. Click "Publish Broadcast" to create an advisory.
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {announcements.map((a) => {
                const badge = PRIORITY_BADGES[a.priority] || PRIORITY_BADGES.info;
                return (
                  <div key={a.id} className="list-group-item p-3 d-flex flex-wrap align-items-start gap-3">
                    <div
                      className={`d-flex align-items-center justify-content-center rounded-3 p-2 ${badge.bg} ${badge.text}`}
                      style={{ width: 44, height: 44, flexShrink: 0 }}
                    >
                      <i className={`bi bi-${badge.icon} fs-5`}></i>
                    </div>

                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                        <span className={`badge ${badge.bg} ${badge.text}`}>{badge.label}</span>
                        <h6 className="fw-bold mb-0 text-dark">{a.title}</h6>
                        <span
                          className={`badge ${
                            a.is_active ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'
                          }`}
                        >
                          {a.is_active ? 'Active' : 'Archived'}
                        </span>
                      </div>
                      <p className="text-muted small mb-2">{a.message}</p>
                      <small className="text-muted">
                        Published on {a.created_at} by <strong>{a.created_by}</strong>
                      </small>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      <button
                        className={`btn btn-sm ${a.is_active ? 'btn-outline-secondary' : 'btn-outline-success'}`}
                        onClick={() => handleToggle(a)}
                        title={a.is_active ? 'Archive Broadcast' : 'Activate Broadcast'}
                      >
                        <i className={`bi bi-${a.is_active ? 'pause-fill' : 'play-fill'} me-1`}></i>
                        {a.is_active ? 'Archive' : 'Publish'}
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setConfirmDelete(a)}
                        title="Delete Broadcast"
                      >
                        <i className="bi bi-trash3"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddAnnouncementModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(msg) => {
            showToast(msg);
            loadAnnouncements();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          className="modal d-block"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060, position: 'fixed', inset: 0 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content border-0 shadow-lg text-center p-4">
              <div className="text-danger fs-1 mb-2">
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>
              <h5 className="fw-bold">Delete Announcement?</h5>
              <p className="text-muted small">
                Are you sure you want to delete broadcast: "<strong>{confirmDelete.title}</strong>"?
              </p>
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddAnnouncementModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    message: '',
    priority: 'info',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.message) {
      setError('Title and message are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createAnnouncement(form);
      onSuccess('Broadcast advisory published successfully.');
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
              <i className="bi bi-megaphone-fill me-2"></i>Publish Broadcast Advisory
            </h5>
            <button className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}
              <div className="mb-3">
                <label className="form-label small fw-semibold">Advisory Category *</label>
                <select
                  className="form-select form-select-sm"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="info">General Information & Platform Update</option>
                  <option value="warning">Weather Warning / IMD Advisory</option>
                  <option value="danger">Pest Outbreak / Critical Alert</option>
                  <option value="success">Government Scheme / Subsidy Notice</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Headline / Title *</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g., Heavy Rainfall Advisory for Kolhapur District"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Advisory Details / Message *</label>
                <textarea
                  className="form-control form-control-sm"
                  rows={4}
                  placeholder="Provide detailed instructions or advisory guidance for farmers..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                ></textarea>
              </div>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="isActiveSwitch"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                <label className="form-check-label small" htmlFor="isActiveSwitch">
                  Make active immediately for all farmers
                </label>
              </div>
            </div>
            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-success btn-sm" disabled={submitting}>
                {submitting ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
