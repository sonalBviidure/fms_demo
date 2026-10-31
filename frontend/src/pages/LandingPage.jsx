import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

// Unsplash free images for agriculture / farm backgrounds
const FARM_BG = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80';
const FIELD_BG = 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1600&q=80';

const LandingPage = () => {
  const { t, toggleLanguage } = useLanguage();

  const features = [
    {
      icon: 'bi-flower2',
      color: 'text-success',
      bg: 'bg-success-subtle',
      title: t('landing.feature1Title'),
      desc: t('landing.feature1Desc'),
    },
    {
      icon: 'bi-wallet2',
      color: 'text-danger',
      bg: 'bg-danger-subtle',
      title: t('landing.feature2Title'),
      desc: t('landing.feature2Desc'),
    },
    {
      icon: 'bi-cash-stack',
      color: 'text-primary',
      bg: 'bg-primary-subtle',
      title: t('landing.feature3Title'),
      desc: t('landing.feature3Desc'),
    },
    {
      icon: 'bi-cpu',
      color: 'text-info',
      bg: 'bg-info-subtle',
      title: t('landing.feature4Title'),
      desc: t('landing.feature4Desc'),
    },
  ];

  const systemOverviewItems = [
    t('landing.overview1'),
    t('landing.overview2'),
    t('landing.overview3'),
    t('landing.overview4'),
  ];

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="navbar navbar-expand-lg navbar-dark py-3" style={{ backgroundColor: '#1b4332' }}>
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold" to="/">
            <i className="bi bi-tree-fill text-success fs-4"></i>
            <span>{t('navigation.brand')}</span>
          </Link>

          <div className="d-flex align-items-center gap-2">
            <button
              className="lang-toggle-btn"
              onClick={toggleLanguage}
              title={t('navigation.switchLanguage')}
            >
              <i className="bi bi-translate"></i>
              {t('navigation.langButtonText')}
            </button>
            <Link to="/login" className="btn btn-outline-light btn-sm px-3">
              {t('login')}
            </Link>
            <Link to="/register" className="btn btn-success btn-sm px-3">
              {t('register')}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section with Background ───────────────────── */}
      <section
        className="hero-bg py-5 text-white"
        style={{ backgroundImage: `url(${FARM_BG})`, minHeight: '480px' }}
      >
        <div className="container py-4">
          <div className="row align-items-center gy-4">
            <div className="col-lg-7">
              <span className="badge bg-warning text-dark fw-semibold mb-3 px-3 py-2 fs-6">
                🌾 {t('landing.smartBadge')}
              </span>
              <h1 className="display-5 fw-bold mb-3">
                {t('landingTitle')}
              </h1>
              <p className="lead mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {t('landingSubtitle')}
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="btn btn-light btn-lg px-4 fw-semibold text-success shadow-sm"
                >
                  {t('goToDashboard')} <i className="bi bi-arrow-right ms-2"></i>
                </Link>
                <Link
                  to="/register"
                  className="btn btn-outline-light btn-lg px-4"
                >
                  {t('createAccount')}
                </Link>
              </div>

              <div className="mt-4 d-flex flex-wrap gap-3">
                <span className="badge bg-success bg-opacity-25 border border-success-subtle px-3 py-2 text-white">
                  <i className="bi bi-check-circle-fill me-1"></i>
                  {t('landing.modulesActive')}
                </span>
                <span className="badge bg-info bg-opacity-25 border border-info-subtle px-3 py-2 text-white">
                  <i className="bi bi-shield-check me-1"></i>
                  {t('landing.secureRecords')}
                </span>
                <span className="badge bg-warning bg-opacity-25 border border-warning-subtle px-3 py-2 text-white">
                  <i className="bi bi-cpu me-1"></i>
                  {t('landing.aiMlIntegrated')}
                </span>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card border-0 shadow-lg bg-white text-dark rounded-4 p-4">
                <h5 className="fw-bold text-success mb-3">
                  <i className="bi bi-clipboard2-pulse me-2"></i>
                  {t('landing.systemOverview')}
                </h5>
                <ul className="list-unstyled mb-0 d-flex flex-column gap-3 small">
                  {systemOverviewItems.map((item, i) => (
                    <li key={i} className="d-flex align-items-start gap-2">
                      <i className="bi bi-check-circle-fill text-success mt-1 flex-shrink-0"></i>
                      <div>{item}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section with farm background ──────────── */}
      <section
        className="py-5 section-farm-bg flex-grow-1"
        style={{ backgroundImage: `url(${FIELD_BG})` }}
      >
        <div className="container py-2">
          <div className="text-center mb-5">
            <span className="text-uppercase text-muted fw-bold small">
              {t('landing.modularArchitecture')}
            </span>
            <h2 className="fw-bold text-dark mt-1">
              {t('landing.coreCapabilities')}
            </h2>
            <p className="text-muted small">
              {t('landing.platformSubtitle')}
            </p>
          </div>

          <div className="row g-4">
            {features.map((f, i) => (
              <div key={i} className="col-md-6 col-lg-3">
                <div className="card h-100 border-0 shadow-sm rounded-4 p-4 text-center hover-card">
                  <div className={`mx-auto mb-3 rounded-circle ${f.bg} d-flex align-items-center justify-content-center`}
                    style={{ width: 64, height: 64, fontSize: '1.6rem' }}>
                    <i className={`bi ${f.icon} ${f.color}`}></i>
                  </div>
                  <h5 className="fw-bold">{f.title}</h5>
                  <p className="text-muted small mb-0">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Row */}
          <div className="row g-3 mt-4">
            {[
              { label: t('navigation.crops'), value: t('landing.moduleActive'), icon: 'bi-flower2', color: 'text-success' },
              { label: t('navigation.expenses'), value: t('landing.moduleActive'), icon: 'bi-wallet2', color: 'text-danger' },
              { label: t('navigation.harvestSales'), value: t('landing.moduleActive'), icon: 'bi-basket3', color: 'text-primary' },
              { label: t('navigation.aiProfitPred'), value: t('landing.liveRates'), icon: 'bi-cpu', color: 'text-info' },
            ].map((s, i) => (
              <div key={i} className="col-6 col-md-3">
                <div className="card border-0 shadow-sm rounded-3 text-center p-3">
                  <i className={`bi ${s.icon} ${s.color} fs-3 mb-2`}></i>
                  <div className="fw-bold fs-5 text-dark">{s.value}</div>
                  <small className="text-muted">{s.label}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer
        className="py-4"
        style={{ backgroundColor: '#1b4332', color: 'rgba(255,255,255,0.8)' }}
      >
        <div className="container">
          <div className="row align-items-center gy-3">
            <div className="col-md-8">
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="bi bi-tree-fill text-success"></i>
                <strong className="text-white">{t('navigation.brand')}</strong>
              </div>
              <small style={{ color: 'rgba(255,255,255,0.65)' }}>
                {t('landing.footerNotice')}
              </small>
            </div>
            <div className="col-md-4 text-md-end d-flex align-items-center justify-content-md-end gap-3">
              <Link to="/admin/login" className="text-white-50 text-decoration-none small" style={{ fontSize: '13px' }}>
                <i className="bi bi-shield-lock me-1"></i>System Admin
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
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
