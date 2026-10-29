import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const REGISTER_BG = 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=1600&q=80';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t, toggleLanguage } = useLanguage();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    location: '',
    totalAcres: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        full_name: formData.fullName,
        phone: formData.phone,
        location: formData.location,
        total_acres: formData.totalAcres,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || t('auth.registrationFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-vh-100 d-flex align-items-center justify-content-center py-5 hero-bg"
      style={{ backgroundImage: `url(${REGISTER_BG})` }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            {/* Top Bar */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Link to="/" className="text-decoration-none d-inline-flex align-items-center gap-2 text-white">
                <i className="bi bi-tree-fill text-warning fs-3"></i>
                <span className="fs-5 fw-bold">{t('navigation.brand')}</span>
              </Link>
              <button
                className="lang-toggle-btn"
                onClick={toggleLanguage}
                title={t('navigation.switchLanguage')}
              >
                <i className="bi bi-translate"></i>
                {t('navigation.langButtonText')}
              </button>
            </div>

            <div className="card border-0 shadow-lg rounded-4 p-4 p-sm-5 bg-white">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h4 className="fw-bold text-dark mb-0">
                  {t('auth.farmerRegistration')}
                </h4>
                <span className="badge bg-success-subtle text-success border border-success-subtle">
                  <i className="bi bi-person-check me-1"></i>{t('auth.secureRegistration')}
                </span>
              </div>

              {error && (
                <div className="alert alert-danger py-2 px-3 small border-0 d-flex align-items-center gap-2 mb-4" role="alert">
                  <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
                  <div>{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <label className="form-label small fw-semibold text-secondary">
                      {t('auth.fullName')}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder={t('auth.fullNamePlaceholder')}
                      required
                    />
                  </div>

                  <div className="col-sm-6">
                    <label className="form-label small fw-semibold text-secondary">
                      {t('auth.mobileNumber')}
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={t('auth.mobilePlaceholder')}
                      required
                    />
                  </div>

                  <div className="col-sm-7">
                    <label className="form-label small fw-semibold text-secondary">
                      {t('location')} *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder={t('auth.locationPlaceholder')}
                      required
                    />
                  </div>

                  <div className="col-sm-5">
                    <label className="form-label small fw-semibold text-secondary">
                      {t('totalAcres')} *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      className="form-control"
                      name="totalAcres"
                      value={formData.totalAcres}
                      onChange={handleChange}
                      placeholder={t('auth.totalLandPlaceholder')}
                      required
                    />
                  </div>

                  <div className="col-sm-6">
                    <label className="form-label small fw-semibold text-secondary">
                      {t('auth.passwordMinChars')}
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={t('auth.passwordMinPlaceholder')}
                      required
                    />
                  </div>

                  <div className="col-sm-6">
                    <label className="form-label small fw-semibold text-secondary">
                      {t('auth.confirmPassword')}
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-fms-primary w-100 py-2 mt-4 d-flex align-items-center justify-content-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>{t('auth.creatingAccount')}</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-plus"></i>
                      <span>{t('auth.createFarmerProfile')}</span>
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-3 pt-3 border-top">
                <p className="small text-muted mb-1">
                  {t('auth.alreadyRegistered')}{' '}
                  <Link to="/login" className="text-success fw-semibold text-decoration-none">
                    {t('auth.signIn')}
                  </Link>
                </p>
                <Link to="/" className="small text-secondary text-decoration-none">
                  <i className="bi bi-arrow-left me-1"></i>
                  {t('auth.backToHome')}
                </Link>
              </div>
            </div>

            <div className="text-center mt-4">
              <small className="text-white-50">
                {t('navigation.brand')} &bull; {t('common.smartAgriAdvisory')}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
