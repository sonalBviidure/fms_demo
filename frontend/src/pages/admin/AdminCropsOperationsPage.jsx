import React, { useState, useEffect, useCallback } from 'react';
import { fetchCrops, updateCropStatus, deleteCrop } from '../../services/adminApi';

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function AdminCropsOperationsPage() {
  const [crops, setCrops] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [seasonFilter, setSeasonFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [statusModalCrop, setStatusModalCrop] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const loadCrops = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCrops();
      setCrops(data);
      setFiltered(data);
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCrops();
  }, [loadCrops]);

  useEffect(() => {
    let list = crops;
    if (statusFilter !== 'ALL') list = list.filter((c) => c.status === statusFilter);
    if (seasonFilter !== 'ALL') list = list.filter((c) => c.season === seasonFilter);

    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (c) =>
          c.crop_name.toLowerCase().includes(q) ||
          (c.variety || '').toLowerCase().includes(q) ||
          c.farmer_name.toLowerCase().includes(q) ||
          c.farmer_username.toLowerCase().includes(q) ||
          (c.field_name || '').toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [crops, statusFilter, seasonFilter, search]);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleStatusChange() {
    if (!statusModalCrop || !newStatus) return;
    setActionLoading(true);
    try {
      const res = await updateCropStatus(statusModalCrop.id, newStatus);
      setCrops((prev) =>
        prev.map((c) => (c.id === statusModalCrop.id ? { ...c, status: res.status } : c))
      );
      showToast(res.message);
      setStatusModalCrop(null);
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      const res = await deleteCrop(confirmDelete.id);
      setCrops((prev) => prev.filter((c) => c.id !== confirmDelete.id));
      showToast(res.message);
      setConfirmDelete(null);
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setActionLoading(false);
    }
  }

  function exportCSV() {
    const headers = ['ID', 'Crop Name', 'Variety', 'Farmer', 'Field', 'Acres', 'Soil', 'Season', 'Status', 'Sowing Date', 'Expenses', 'Revenue', 'Net Profit'];
    const rows = filtered.map((c) => [
      c.id,
      `"${c.crop_name}"`,
      `"${c.variety}"`,
      `"${c.farmer_name}"`,
      `"${c.field_name}"`,
      c.land_area,
      c.soil_type,
      c.season,
      c.status,
      c.sowing_date,
      c.total_expenses,
      c.total_revenue,
      c.net_profit,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `crop_operations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const totalCrops = crops.length;
  const sownCount = crops.filter((c) => c.status === 'Sown').length;
  const growingCount = crops.filter((c) => c.status === 'Growing').length;
  const harvestedCount = crops.filter((c) => c.status === 'Harvested').length;
  const closedCount = crops.filter((c) => c.status === 'Closed').length;

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
            <i className="bi bi-flower1 me-2 text-success"></i>Crop Cultivation Operations
          </h4>
          <small className="text-muted">
            Track and govern crop cultivation lifecycles across all registered farmers
          </small>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={exportCSV}>
            <i className="bi bi-file-earmark-arrow-down me-1"></i>Export CSV
          </button>
          <button className="btn btn-outline-success btn-sm" onClick={loadCrops}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
        </div>
      </div>

      {/* Operational Counters */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Total Cycles</div>
            <div className="fw-bold fs-3 text-dark">{totalCrops}</div>
            <small className="text-muted">All registered</small>
          </div>
        </div>
        <div className="col-6 col-md">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Sown (Early)</div>
            <div className="fw-bold fs-3 text-warning">{sownCount}</div>
            <small className="text-muted">Newly planted</small>
          </div>
        </div>
        <div className="col-6 col-md">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Growing (Active)</div>
            <div className="fw-bold fs-3 text-primary">{growingCount}</div>
            <small className="text-muted">In field lifecycle</small>
          </div>
        </div>
        <div className="col-6 col-md">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Harvested</div>
            <div className="fw-bold fs-3 text-success">{harvestedCount}</div>
            <small className="text-muted">Yield produced</small>
          </div>
        </div>
        <div className="col-6 col-md">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Closed Cycles</div>
            <div className="fw-bold fs-3 text-secondary">{closedCount}</div>
            <small className="text-muted">Archived seasons</small>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2 px-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
          {/* Status Tabs */}
          <div className="btn-group btn-group-sm">
            {['ALL', 'Sown', 'Growing', 'Harvested', 'Closed'].map((st) => (
              <button
                key={st}
                className={`btn ${statusFilter === st ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setStatusFilter(st)}
              >
                {st} {st === 'ALL' ? `(${totalCrops})` : ''}
              </button>
            ))}
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Season Filter */}
            <select
              className="form-select form-select-sm"
              style={{ width: 140 }}
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
            >
              <option value="ALL">All Seasons</option>
              <option value="Kharif">Kharif (Monsoon)</option>
              <option value="Rabi">Rabi (Winter)</option>
              <option value="Zaid">Zaid (Summer)</option>
              <option value="Annual">Annual</option>
            </select>

            {/* Search */}
            <div className="input-group" style={{ maxWidth: 260 }}>
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control form-control-sm border-start-0"
                placeholder="Crop, variety, farmer..."
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
      </div>

      {/* Crops Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success"></div>
              <div className="mt-2 text-muted small">Loading crops operations...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-flower1 fs-1 d-block mb-2 text-secondary"></i>
              No crop cultivation records match current filters.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Crop & Variety</th>
                    <th>Farmer</th>
                    <th>Field & Acreage</th>
                    <th>Season</th>
                    <th>Sowing Date</th>
                    <th className="text-end">Expenses</th>
                    <th className="text-end">Revenue</th>
                    <th className="text-end">Net P/L</th>
                    <th className="text-center">Status</th>
                    <th className="text-center" style={{ width: 110 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="fw-semibold text-dark">{c.crop_name}</div>
                        <small className="text-muted">{c.variety || 'Standard Hybrid'}</small>
                      </td>
                      <td>
                        <div className="fw-semibold">{c.farmer_name}</div>
                        <small className="text-muted">@{c.farmer_username}</small>
                      </td>
                      <td>
                        <div>{c.field_name}</div>
                        <small className="text-muted">
                          {c.land_area} Ac &middot; {c.soil_type}
                        </small>
                      </td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary">{c.season}</span>
                      </td>
                      <td className="text-muted">{c.sowing_date}</td>
                      <td className="text-end text-danger">{fmtINR(c.total_expenses)}</td>
                      <td className="text-end text-success">{fmtINR(c.total_revenue)}</td>
                      <td className={`text-end fw-bold ${c.net_profit >= 0 ? 'text-success' : 'text-danger'}`}>
                        {fmtINR(c.net_profit)}
                      </td>
                      <td className="text-center">
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
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          {/* Change Status */}
                          <button
                            className="btn btn-sm btn-outline-primary p-1"
                            style={{ width: 28, height: 28 }}
                            onClick={() => {
                              setStatusModalCrop(c);
                              setNewStatus(c.status);
                            }}
                            title="Update Crop Lifecycle Status"
                          >
                            <i className="bi bi-arrow-repeat"></i>
                          </button>

                          {/* Delete Crop */}
                          <button
                            className="btn btn-sm btn-outline-danger p-1"
                            style={{ width: 28, height: 28 }}
                            onClick={() => setConfirmDelete(c)}
                            title="Delete Crop Record"
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
          <div className="card-footer bg-white text-muted small py-2">
            Showing {filtered.length} of {crops.length} cultivation cycles
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      {statusModalCrop && (
        <div
          className="modal d-block"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050, position: 'fixed', inset: 0 }}
          onClick={(e) => e.target === e.currentTarget && setStatusModalCrop(null)}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title mb-0">
                  <i className="bi bi-arrow-repeat me-2"></i>Update Crop Lifecycle
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setStatusModalCrop(null)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="small text-muted mb-3">
                  Crop: <strong>{statusModalCrop.crop_name}</strong> by{' '}
                  <strong>{statusModalCrop.farmer_name}</strong>
                </p>

                <label className="form-label small fw-semibold">Select Lifecycle Status</label>
                <select
                  className="form-select form-select-sm"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="Sown">Sown (Initial planting phase)</option>
                  <option value="Growing">Growing (Active vegetative & flowering)</option>
                  <option value="Harvested">Harvested (Produce yielded)</option>
                  <option value="Closed">Closed (Financials resolved & cycle ended)</option>
                </select>
              </div>
              <div className="modal-footer bg-light">
                <button className="btn btn-secondary btn-sm" onClick={() => setStatusModalCrop(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleStatusChange} disabled={actionLoading}>
                  {actionLoading ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
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
              <h5 className="fw-bold">Delete Crop Record?</h5>
              <p className="text-muted small">
                Are you sure you want to delete crop <strong>{confirmDelete.crop_name}</strong> for farmer{' '}
                <strong>{confirmDelete.farmer_name}</strong>? All associated expenses, harvests, and sales will also be
                removed.
              </p>
              <div className="d-flex justify-content-center gap-2 mt-3">
                <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={actionLoading}>
                  {actionLoading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
