import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../../services/adminApi';

export default function AdminLoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await adminLogin(form.username, form.password);
      localStorage.setItem('fms_admin_token', data.token);
      localStorage.setItem('fms_admin_user', JSON.stringify({ username: data.username, full_name: data.full_name }));
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: 'linear-gradient(135deg, #1a3c2e 0%, #2d6a4f 50%, #1a3c2e 100%)' }}
    >
      <div className="card border-0 shadow-lg" style={{ width: '100%', maxWidth: '420px', borderRadius: 16 }}>
        <div className="card-body p-5">
          {/* Logo */}
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center bg-success text-white rounded-circle mb-3 shadow"
              style={{ width: 68, height: 68 }}
            >
              <i className="bi bi-shield-lock-fill fs-2"></i>
            </div>
            <h4 className="fw-bold text-dark mb-0">System Admin Portal</h4>
            <p className="text-muted small">Farm Management System — Administrator Sign In</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small mb-3">
              <i className="bi bi-exclamation-triangle me-2"></i>{error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold small text-dark">Admin Username</label>
              <div className="input-group">
                <span className="input-group-text bg-light"><i className="bi bi-person text-secondary"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter administrator username"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold small text-dark">Admin Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light"><i className="bi bi-lock text-secondary"></i></span>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-success w-100 py-2 fw-semibold shadow-sm" disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Authenticating...</>
              ) : (
                <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In to Admin Portal</>
              )}
            </button>
          </form>

          <div className="text-center mt-4 pt-2 border-top">
            <small className="text-muted">
              <i className="bi bi-shield-check me-1 text-success"></i>
              Authorized administrative personnel only
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
