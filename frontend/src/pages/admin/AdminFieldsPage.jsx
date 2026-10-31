import React, { useState, useEffect, useCallback } from 'react';
import { fetchFields } from '../../services/adminApi';

export default function AdminFieldsPage() {
  const [data, setData] = useState({ fields: [], soil_distribution: [], total_fields: 0, total_acres: 0 });
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soilFilter, setSoilFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFields();
      setData(res);
      setFiltered(res.fields || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let list = data.fields || [];
    if (soilFilter !== 'ALL') {
      list = list.filter((f) => f.soil_type === soilFilter);
    }
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (f) =>
          f.field_name.toLowerCase().includes(q) ||
          f.farmer_name.toLowerCase().includes(q) ||
          f.soil_type.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [data, soilFilter, search]);

  const avgParcelSize = data.total_fields > 0 ? (data.total_acres / data.total_fields).toFixed(1) : 0;

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div>
          <h4 className="fw-bold mb-0 text-dark">
            <i className="bi bi-grid-3x3-gap-fill me-2 text-success"></i>Agricultural Land Parcels
          </h4>
          <small className="text-muted">
            Inspect land holdings, soil classifications, and plot parcels across all farms
          </small>
        </div>
        <button className="btn btn-outline-success btn-sm" onClick={loadData}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger py-2 small mb-4">{error}</div>}

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Total Parcels</div>
            <div className="fw-bold fs-3 text-dark">{data.total_fields}</div>
            <small className="text-muted">Registered agricultural plots</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Total Land Area</div>
            <div className="fw-bold fs-3 text-success">{data.total_acres} Ac</div>
            <small className="text-muted">Platform acreage</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Average Plot Size</div>
            <div className="fw-bold fs-3 text-primary">{avgParcelSize} Ac</div>
            <small className="text-muted">Per registered parcel</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-muted small">Soil Classifications</div>
            <div className="fw-bold fs-3 text-warning">{data.soil_distribution?.length || 0}</div>
            <small className="text-muted">Types represented</small>
          </div>
        </div>
      </div>

      {/* Soil Type Distribution Chips */}
      {data.soil_distribution?.length > 0 && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white fw-bold py-2 small text-uppercase">
            <i className="bi bi-layers-fill me-2 text-success"></i>Soil Type Distribution
          </div>
          <div className="card-body py-3">
            <div className="d-flex flex-wrap gap-2">
              <button
                className={`btn btn-sm ${soilFilter === 'ALL' ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setSoilFilter('ALL')}
              >
                All Soils ({data.total_fields})
              </button>
              {data.soil_distribution.map((s) => (
                <button
                  key={s.soil}
                  className={`btn btn-sm ${soilFilter === s.soil ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => setSoilFilter(s.soil)}
                >
                  {s.soil} ({s.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2 px-3 d-flex justify-content-between align-items-center">
          <span className="small text-muted fw-semibold">
            Showing {filtered.length} of {data.total_fields} parcels
          </span>
          <div className="input-group" style={{ maxWidth: 300 }}>
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control form-control-sm border-start-0"
              placeholder="Search field or farmer..."
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

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success"></div>
              <div className="mt-2 text-muted small">Loading land parcels...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-geo-alt fs-1 d-block mb-2 text-secondary"></i>
              No fields match your search.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Parcel / Field Name</th>
                    <th>Farmer</th>
                    <th className="text-center">Area (Acres)</th>
                    <th className="text-center">Soil Classification</th>
                    <th className="text-center">Active Crops</th>
                    <th className="text-center">Registered Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f) => (
                    <tr key={f.id}>
                      <td className="fw-semibold text-dark">
                        <i className="bi bi-geo-alt-fill text-success me-2"></i>
                        {f.field_name}
                      </td>
                      <td>{f.farmer_name}</td>
                      <td className="text-center fw-bold text-dark">{f.land_area} Ac</td>
                      <td className="text-center">
                        <span className="badge bg-secondary-subtle text-secondary px-2 py-1">
                          {f.soil_type} Soil
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-primary-subtle text-primary">
                          {f.crop_count} cultivated
                        </span>
                      </td>
                      <td className="text-center text-muted">{f.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
