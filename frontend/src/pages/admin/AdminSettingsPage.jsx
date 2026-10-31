import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminSettingsPage() {
  const { language, setLang } = useLanguage();
  const [toast, setToast] = useState(null);

  const [settings, setSettings] = useState({
    siteName: 'Farm Management System (FMS)',
    supportEmail: 'admin@farmportal.gov.in',
    supportPhone: '+91 20 2567 8900',
    maintenanceMode: false,
    autoFinancialRecalc: true,
    recalcIntervalHours: '24',
    enableAIWeather: true,
    enableMandiForecast: true,
  });

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function handleSave(e) {
    e.preventDefault();
    localStorage.setItem('fms_admin_settings', JSON.stringify(settings));
    showToast('Platform settings saved successfully!');
  }

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
      <div className="mb-4">
        <h4 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
          <i className="bi bi-gear-fill text-success"></i>
          <span>Admin Settings &amp; Configuration</span>
        </h4>
        <small className="text-muted">
          Configure default interface language, platform parameters, and automated background jobs
        </small>
      </div>

      <div className="row g-4">
        {/* Left Column: Language & Platform Info */}
        <div className="col-lg-6">
          {/* 1. Language Configuration */}
          <div className="card border-0 shadow-sm bg-white mb-4" style={{ borderRadius: 14 }}>
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-translate text-primary"></i>
                <span>Language &amp; Localization</span>
              </h6>
            </div>
            <div className="card-body p-4">
              <label className="form-label small fw-semibold">Default Platform Language</label>
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <button
                    type="button"
                    className={`btn w-100 p-3 text-start border ${
                      language === 'en' ? 'border-success bg-success bg-opacity-10 text-success fw-bold' : 'btn-light'
                    }`}
                    onClick={() => {
                      setLang('en');
                      showToast('Default language set to English');
                    }}
                  >
                    <div className="fs-5 mb-1">🇬🇧 English</div>
                    <small className="text-muted">Standard interface in English</small>
                  </button>
                </div>
                <div className="col-6">
                  <button
                    type="button"
                    className={`btn w-100 p-3 text-start border ${
                      language === 'mr' ? 'border-success bg-success bg-opacity-10 text-success fw-bold' : 'btn-light'
                    }`}
                    onClick={() => {
                      setLang('mr');
                      showToast('Default language set to मराठी (Marathi)');
                    }}
                  >
                    <div className="fs-5 mb-1">🇮🇳 मराठी (Marathi)</div>
                    <small className="text-muted">प्रादेशिक भाषा समर्थन</small>
                  </button>
                </div>
              </div>
              <small className="text-muted">
                Sets the active language for menus, agricultural terms, and reports across the portal.
              </small>
            </div>
          </div>

          {/* 2. Platform Identity */}
          <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: 14 }}>
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-info-circle text-info"></i>
                <span>Platform Identity &amp; Support Info</span>
              </h6>
            </div>
            <div className="card-body p-4">
              <div className="mb-3">
                <label className="form-label small fw-semibold">Platform Brand Name</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                />
              </div>

              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold">Official Support Email</label>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold">Helpline Phone</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={settings.supportPhone}
                    onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: System Configuration Form */}
        <div className="col-lg-6">
          <form onSubmit={handleSave}>
            <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: 14 }}>
              <div className="card-header bg-white border-bottom py-3">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-sliders text-success"></i>
                  <span>System Configuration &amp; Automation</span>
                </h6>
              </div>

              <div className="card-body p-4">
                {/* Maintenance Mode */}
                <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3 mb-3">
                  <div>
                    <div className="fw-bold text-dark small">Maintenance Mode</div>
                    <small className="text-muted">Temporarily display a maintenance notice to farmers</small>
                  </div>
                  <div className="form-check form-switch fs-5">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    />
                  </div>
                </div>

                {/* Auto Financial Recalculation */}
                <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3 mb-3">
                  <div>
                    <div className="fw-bold text-dark small">Automated Financial Recalculation</div>
                    <small className="text-muted">Automatically sync net profits whenever sales are logged</small>
                  </div>
                  <div className="form-check form-switch fs-5">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.autoFinancialRecalc}
                      onChange={(e) => setSettings({ ...settings, autoFinancialRecalc: e.target.checked })}
                    />
                  </div>
                </div>

                {/* AI Weather Integration */}
                <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3 mb-3">
                  <div>
                    <div className="fw-bold text-dark small">AI Weather Auto-Predict</div>
                    <small className="text-muted">Auto-select regional agro-climate presets in Crop Advisory</small>
                  </div>
                  <div className="form-check form-switch fs-5">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.enableAIWeather}
                      onChange={(e) => setSettings({ ...settings, enableAIWeather: e.target.checked })}
                    />
                  </div>
                </div>

                {/* Mandi AI Pricing Engine */}
                <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3 mb-4">
                  <div>
                    <div className="fw-bold text-dark small">AI Mandi Benchmark Engine</div>
                    <small className="text-muted">Calculate APMC benchmark prices via AI forecasting models</small>
                  </div>
                  <div className="form-check form-switch fs-5">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.enableMandiForecast}
                      onChange={(e) => setSettings({ ...settings, enableMandiForecast: e.target.checked })}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-success w-100 py-2 fw-semibold shadow-sm">
                  <i className="bi bi-check2-circle me-1"></i>
                  Save Configuration
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
