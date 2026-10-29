import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getFarmerProfile, updateFarmerProfile } from '../services/api';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();

  const [form, setForm] = useState({
    full_name: '',
    location: '',
    total_acres: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError('');
    try {
      const data = await getFarmerProfile();
      setForm({
        full_name: data.full_name || '',
        location: data.location || '',
        total_acres: data.total_acres || '',
      });
      if (setUser) setUser(data);
    } catch (e) {
      // Fall back to context user if available
      if (user) {
        setForm({
          full_name: user.full_name || '',
          location: user.location || '',
          total_acres: user.total_acres || '',
        });
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        full_name: form.full_name,
        location: form.location,
        total_acres: parseFloat(form.total_acres) || 0,
      };
      const res = await updateFarmerProfile(payload);
      setSuccess(t('profile.profileUpdated'));
      if (res.user && setUser) setUser(res.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const displayName = user?.full_name || user?.username || 'Farmer';
  const initials = displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="fw-bold text-success mb-1">
          <i className="bi bi-person-circle me-2"></i>
          {t('myProfile')}
        </h2>
        <p className="text-muted small mb-0">
          {t('profile.subtitle')}
        </p>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
          <button className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          <i className="bi bi-check-circle me-2"></i>{success}
          <button className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Left: Profile Card */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            {/* Green banner */}
            <div
              className="p-4 text-white text-center"
              style={{ background: 'linear-gradient(135deg, #1b4332, #40916c)' }}
            >
              <div className="profile-avatar mx-auto mb-3">
                {initials}
              </div>
              <h5 className="fw-bold mb-1">{displayName}</h5>
              <small className="text-white-50">
                {user?.location || t('common.defaultLocation')}
              </small>
            </div>
            <div className="card-body p-4">
              <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                <li className="d-flex align-items-start gap-3">
                  <div
                    className="rounded-circle bg-success-subtle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 38, height: 38 }}
                  >
                    <i className="bi bi-telephone-fill text-success"></i>
                  </div>
                  <div>
                    <small className="text-muted d-block">{t('phone')}</small>
                    <strong>+91 {user?.phone || '—'}</strong>
                  </div>
                </li>
                <li className="d-flex align-items-start gap-3">
                  <div
                    className="rounded-circle bg-primary-subtle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 38, height: 38 }}
                  >
                    <i className="bi bi-geo-alt-fill text-primary"></i>
                  </div>
                  <div>
                    <small className="text-muted d-block">{t('location')}</small>
                    <strong>{user?.location || '—'}</strong>
                  </div>
                </li>
                <li className="d-flex align-items-start gap-3">
                  <div
                    className="rounded-circle bg-warning-subtle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 38, height: 38 }}
                  >
                    <i className="bi bi-map-fill text-warning"></i>
                  </div>
                  <div>
                    <small className="text-muted d-block">{t('totalAcres')}</small>
                    <strong>{user?.total_acres || 0} {t('acres')}</strong>
                  </div>
                </li>
              </ul>

              <hr />

              {/* System Info */}
              <div className="p-3 bg-light rounded-3 text-center">
                <i className="bi bi-shield-check text-success fs-4 mb-2 d-block"></i>
                <div className="fw-semibold text-dark small">{t('navigation.brand')}</div>
                <small className="text-muted">
                    {t('common.smartAgriPlatform')}
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Edit Form */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="fw-bold mb-0 text-dark">
                <i className="bi bi-pencil-square me-2 text-success"></i>
                {t('profile.updateProfile')}
              </h6>
            </div>
            <div className="card-body p-4">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success"></div>
                  <p className="mt-2 text-muted small">{t('loading')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">
                        {t('fullName')} *
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={form.full_name}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t('profile.fullNamePlaceholder')}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">
                        {t('phone')}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={user?.phone || ''}
                        disabled
                        readOnly
                      />
                      <small className="text-muted">
                        {t('profile.phoneCannotChange')}
                      </small>
                    </div>

                    <div className="col-md-8">
                      <label className="form-label fw-semibold small">
                        {t('location')} *
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={form.location}
                        onChange={handleChange}
                        className="form-control"
                        placeholder={t('profile.locationPlaceholder')}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold small">
                        {t('totalAcres')} *
                      </label>
                      <div className="input-group">
                        <input
                          type="number"
                          name="total_acres"
                          value={form.total_acres}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="e.g. 5.5"
                          min="0"
                          step="0.1"
                          required
                        />
                        <span className="input-group-text">{t('acres')}</span>
                      </div>
                    </div>

                    <div className="col-12 mt-2">
                      <div className="alert alert-info py-2 mb-0 small">
                        <i className="bi bi-info-circle me-2"></i>
                        {t('profile.usernameNotice')}
                        {' '}<strong>{user?.username}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-success px-4 fw-semibold"
                      disabled={saving}
                    >
                      {saving && <span className="spinner-border spinner-border-sm me-2"></span>}
                      <i className="bi bi-check-lg me-1"></i>
                      {t('updateProfile')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={loadProfile}
                      disabled={saving || loading}
                    >
                      <i className="bi bi-arrow-counterclockwise me-1"></i>
                      {t('common.reset')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Account Security Info */}
          <div className="card border-0 shadow-sm rounded-4 mt-4">
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="fw-bold mb-0 text-dark">
                <i className="bi bi-shield-lock me-2 text-warning"></i>
                {t('profile.accountSecurity')}
              </h6>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded-3">
                    <small className="text-muted d-block mb-1">
                      <i className="bi bi-person-badge me-1"></i>
                      {t('profile.username')}
                    </small>
                    <strong>{user?.username || '—'}</strong>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-3 bg-light rounded-3">
                    <small className="text-muted d-block mb-1">
                      <i className="bi bi-key me-1"></i>
                      {t('profile.password')}
                    </small>
                    <strong>••••••••</strong>
                  </div>
                </div>
                <div className="col-12">
                  <small className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    {t('profile.passwordHelp')}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
