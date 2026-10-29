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
      <div className="card border-0 shadow-lg" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="card-body p-5">
          {/* Logo */}
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center bg-success rounded-circle mb-3"
              style={{ width: 70, height: 70 }}
            >
              <i className="bi bi-shield-lock-fill text-white fs-2"></i>
            </div>
            <h4 className="fw-bold text-dark mb-0">FMS Admin Panel</h4>
            <p className="text-muted small">Farm Management System — System Administration</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small">
              <i className="bi bi-exclamation-triangle me-2"></i>{error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Username</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-person"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Admin username"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold small">Password</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-lock"></i></span>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Admin password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-success w-100 py-2 fw-semibold" disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Signing in...</>
              ) : (
                <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In to Admin Panel</>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <small className="text-muted">
              <i className="bi bi-shield-check me-1 text-success"></i>
              Restricted to authorized administrators only
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
