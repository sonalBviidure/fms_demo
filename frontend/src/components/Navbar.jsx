import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, toggleLanguage } = useLanguage();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = user?.full_name || user?.username || 'Farmer';
  const subtitle = user?.location
    ? `${user.location} (${user.total_acres || 0} ${t('acres')})`
    : t('common.activeSession');

  return (
    <header className="top-navbar d-flex align-items-center justify-content-between gap-2">
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-outline-secondary btn-sm d-lg-none"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation"
        >
          <i className="bi bi-list fs-5"></i>
        </button>
        <div className="d-none d-sm-flex align-items-center gap-2">
          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
            <i className="bi bi-shield-check me-1"></i>
            {t('navigation.brand')}
          </span>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 gap-md-3">
        {/* Language toggle in top navbar */}
        <button
          className="lang-toggle-btn navbar-variant d-none d-md-flex"
          onClick={toggleLanguage}
          title={t('navigation.switchLanguage')}
        >
          <i className="bi bi-translate"></i>
          {t('navigation.langButtonText')}
        </button>

        <div className="text-end d-none d-md-block">
          <div className="fw-semibold text-dark small lh-sm">{displayName}</div>
          <small className="text-muted" style={{ fontSize: '0.72rem' }}>{subtitle}</small>
        </div>

        <div className="dropdown">
          <button
            className="btn btn-light rounded-circle p-1 border d-flex align-items-center justify-content-center"
            style={{ width: '38px', height: '38px' }}
            id="userMenuBtn"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="bi bi-person-circle fs-5 text-fms-primary"></i>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm" aria-labelledby="userMenuBtn">
            <li>
              <div className="dropdown-item-text">
                <div className="fw-bold">{displayName}</div>
                <small className="text-muted">
                  {user?.phone ? `+91 ${user.phone}` : t('common.farmerAccount')}
                </small>
              </div>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <Link className="dropdown-item" to="/profile">
                <i className="bi bi-person me-2"></i>{t('navigation.profile')}
              </Link>
            </li>
            <li>
              <Link className="dropdown-item" to="/dashboard">
                <i className="bi bi-speedometer2 me-2"></i>{t('navigation.dashboard')}
              </Link>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button
                className="dropdown-item"
                onClick={toggleLanguage}
              >
                <i className="bi bi-translate me-2"></i>
                {t('navigation.switchToOther')}
              </button>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item text-danger" onClick={handleSignOut}>
                <i className="bi bi-box-arrow-right me-2"></i>{t('navigation.logout')}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
