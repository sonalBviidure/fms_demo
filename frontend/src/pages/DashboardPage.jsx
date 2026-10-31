import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getDashboardSummary } from '../services/api';
import { fetchPublicAnnouncements } from '../services/adminApi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

// A simple field background for the dashboard banner
const DASHBOARD_BG = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1400&q=70';

const DashboardPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const farmerName = user?.full_name || user?.username || 'Farmer';
  const farmLocation = user?.location || t('common.defaultLocation');
  const farmAcres = user?.total_acres ? `${user.total_acres} ${t('acres')}` : t('registered');

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    summary: {
      total_crops: 0,
      active_crops: 0,
      total_fields: 0,
      total_expenses: 0,
      total_revenue: 0,
      net_profit: 0,
    },
    recent_crops: [],
    season_breakdown: [],
    expense_by_category: [],
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError('');
    try {
      const [data, ann] = await Promise.all([
        getDashboardSummary(),
        fetchPublicAnnouncements().catch(() => []),
      ]);
      if (Array.isArray(ann)) setAnnouncements(ann);
      if (data && data.summary) {
        setDashboardData(data);
      }
    } catch (e) {
      console.warn('Dashboard fetch error:', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const { summary, recent_crops, season_breakdown } = dashboardData;

  const stats = [
    {
      id: 'crops',
      title: t('totalCrops'),
      value: `${summary.active_crops} ${t('common.active')}`,
      subtitle: `${summary.total_crops} ${t('common.total')}, ${summary.total_fields} ${t('common.field')}`,
      icon: 'bi-flower2',
      color: 'text-success',
      bgColor: 'bg-success-subtle',
      route: '/crops',
    },
    {
      id: 'expenses',
      title: t('totalExpenses'),
      value: `₹ ${Number(summary.total_expenses).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: t('dashboard.expensesSubtitle'),
      icon: 'bi-wallet2',
      color: 'text-danger',
      bgColor: 'bg-danger-subtle',
      route: '/expenses',
    },
    {
      id: 'revenue',
      title: t('totalRevenue'),
      value: `₹ ${Number(summary.total_revenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: t('dashboard.revenueSubtitle'),
      icon: 'bi-cash-coin',
      color: 'text-primary',
      bgColor: 'bg-primary-subtle',
      route: '/harvest-sales',
    },
    {
      id: 'profit',
      title: t('netProfit'),
      value: `${summary.net_profit >= 0 ? '+' : ''}₹ ${Number(summary.net_profit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: summary.net_profit >= 0
        ? t('dashboard.profitableMargin')
        : t('dashboard.lossMargin'),
      icon: summary.net_profit >= 0 ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow',
      color: summary.net_profit >= 0 ? 'text-success' : 'text-danger',
      bgColor: summary.net_profit >= 0 ? 'bg-success-subtle' : 'bg-danger-subtle',
      route: '/reports',
    },
  ];

  return (
    <div className="container-fluid p-0">
      {/* ── Welcome Banner with subtle farm bg ──────────────── */}
      <div
        className="rounded-4 p-4 mb-4 text-white position-relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(27,67,50,0.92) 0%, rgba(45,106,79,0.88) 100%), url(${DASHBOARD_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="row align-items-center g-3">
          <div className="col">
            <h4 className="fw-bold mb-1">
              {t('welcomeBack')}, {farmerName}! 🌾
            </h4>
            <p className="mb-0 small" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {t('dashboard.subtitle')}
            </p>
          </div>
          <div className="col-auto d-flex align-items-center gap-2 flex-wrap">
            <span className="badge bg-white text-dark border px-3 py-2">
              <i className="bi bi-geo-alt-fill text-danger me-1"></i>
              {farmLocation} ({farmAcres})
            </span>
            <button
              className="btn btn-light btn-sm px-3"
              onClick={loadDashboard}
              disabled={loading}
              title={t('dashboard.refreshMetrics')}
            >
              <i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spin' : ''}`}></i>
              {t('refresh')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Active Broadcast Announcements from System Admin ─ */}
      {announcements.length > 0 && (
        <div className="mb-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`alert ${
                ann.priority === 'danger'
                  ? 'alert-danger border-danger'
                  : ann.priority === 'warning'
                  ? 'alert-warning border-warning'
                  : ann.priority === 'success'
                  ? 'alert-success border-success'
                  : 'alert-info border-info'
              } d-flex align-items-center gap-3 py-2 px-3 shadow-sm mb-2`}
              role="alert"
            >
              <i
                className={`bi bi-${
                  ann.priority === 'danger'
                    ? 'exclamation-octagon-fill text-danger'
                    : ann.priority === 'warning'
                    ? 'exclamation-triangle-fill text-warning'
                    : ann.priority === 'success'
                    ? 'check-circle-fill text-success'
                    : 'info-circle-fill text-info'
                } fs-4 flex-shrink-0`}
              ></i>
              <div className="flex-grow-1 min-w-0">
                <div className="fw-bold small mb-0">{ann.title}</div>
                <div className="small text-muted text-truncate">{ann.message}</div>
              </div>
              <span className="badge bg-white text-secondary border small">{ann.created_at}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="alert alert-warning alert-dismissible fade show mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* ── 4 KPI Cards ─────────────────────────────────────── */}
      <div className="row g-3 mb-4">
        {stats.map((stat) => (
          <div key={stat.id} className="col-12 col-sm-6 col-xl-3">
            <div className="kpi-card h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-secondary small fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>
                    {stat.title}
                  </span>
                  <div className={`kpi-icon-box ${stat.bgColor} ${stat.color}`}>
                    <i className={`bi ${stat.icon}`}></i>
                  </div>
                </div>
                <h3 className="fw-bold text-dark mb-1">
                  {loading ? (
                    <span className="spinner-border spinner-border-sm text-secondary"></span>
                  ) : (
                    stat.value
                  )}
                </h3>
                <p className="text-muted small mb-0">{stat.subtitle}</p>
              </div>
              <div className="pt-3 mt-3 border-top d-flex justify-content-between align-items-center">
                <Link to={stat.route} className="text-decoration-none small text-success fw-semibold">
                  {t('common.viewDetails')}{' '}
                  <i className="bi bi-chevron-right ms-1"></i>
                </Link>
                <span className="badge bg-light text-muted border" style={{ fontSize: '0.68rem' }}>
                  {t('common.liveData')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Content Area ────────────────────────────────── */}
      <div className="row g-4">
        {/* Left: Recent Crops Table */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0 text-dark">
                <i className="bi bi-flower2 text-success me-2"></i>
                {t('dashboard.activeCropsMonitoring')}
              </h6>
              <Link to="/crops" className="btn btn-outline-success btn-sm">
                <i className="bi bi-plus-lg me-1"></i>
                {t('dashboard.manageCrops')}
              </Link>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success"></div>
                  <p className="mt-2 text-muted small">{t('loading')}</p>
                </div>
              ) : recent_crops.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-seedling fs-1 d-block mb-2 text-success opacity-50"></i>
                  <p className="mb-2">
                    {t('dashboard.noActiveCrops')}
                  </p>
                  <Link to="/crops" className="btn btn-success btn-sm">
                    <i className="bi bi-plus-lg me-1"></i>
                    {t('dashboard.addFirstCrop')}
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small text-secondary">
                      <tr>
                        <th className="ps-3">{t('cropName')}</th>
                        <th>{t('field')}</th>
                        <th>{t('sowingDate')}</th>
                        <th>{t('season')}</th>
                        <th>{t('status')}</th>
                        <th className="text-end pe-3">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="small">
                      {recent_crops.map((crop) => (
                        <tr key={crop.id}>
                          <td className="ps-3 fw-semibold text-dark">
                            {crop.crop_name} {crop.variety ? `(${crop.variety})` : ''}
                          </td>
                          <td>
                            {crop.field_name}{' '}
                            <span className="text-muted">({crop.field_land_area} {t('common.ac')})</span>
                          </td>
                          <td>{crop.sowing_date}</td>
                          <td>
                            <span className="badge bg-primary-subtle text-primary">
                              {t(`seasonLabels.${crop.season}`, { defaultValue: crop.season })}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${
                              crop.status === 'Growing'   ? 'bg-success-subtle text-success' :
                              crop.status === 'Harvested' ? 'bg-warning-subtle text-warning' :
                              crop.status === 'Sown'      ? 'bg-info-subtle text-info' :
                              'bg-secondary-subtle text-secondary'
                            }`}>
                              {t(`cropStatuses.${crop.status}`, { defaultValue: crop.status })}
                            </span>
                          </td>
                          <td className="text-end pe-3">
                            <Link
                              to={`/expenses?crop_id=${crop.id}`}
                              className="btn btn-sm btn-outline-secondary py-0 px-2"
                              title={t('dashboard.viewExpenses')}
                            >
                              <i className="bi bi-wallet2"></i>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="card-footer bg-white text-muted small py-2 ps-3 d-flex justify-content-between align-items-center">
              <span>
                <i className="bi bi-database-check text-success me-1"></i>
                {t('dashboard.connectedDb')}
              </span>
              <Link to="/crops" className="text-decoration-none text-success fw-semibold">
                {t('dashboard.viewAllCrops')} &rarr;
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
            <h6 className="fw-bold text-dark mb-3">
              <i className="bi bi-lightning-charge text-warning me-2"></i>
              {t('quickActions')}
            </h6>
            <div className="row g-2">
              {[
                { route: '/crops', icon: 'bi-flower1', label: t('addCrop'), color: 'success' },
                { route: '/expenses', icon: 'bi-wallet2', label: t('logExpense'), color: 'danger' },
                { route: '/harvest-sales', icon: 'bi-basket3', label: t('recordSale'), color: 'primary' },
                { route: '/ai-crop-recommendation', icon: 'bi-cpu', label: t('aiAdvisory'), color: 'info' },
              ].map((action) => (
                <div key={action.route} className="col-sm-6 col-md-3">
                  <Link
                    to={action.route}
                    className={`btn btn-outline-${action.color} w-100 py-2 d-flex flex-column align-items-center gap-1`}
                  >
                    <i className={`bi ${action.icon} fs-5`}></i>
                    <span className="small fw-semibold">{action.label}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-lg-4">
          {/* Chart.js Financial Overview Doughnut */}
          <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="fw-bold mb-0 text-dark">
                <i className="bi bi-pie-chart-fill text-success me-2"></i>
                {t('dashboard.financialOverviewChart')}
              </h6>
            </div>
            <div className="card-body">
              {summary.total_expenses > 0 || summary.total_revenue > 0 ? (
                <div style={{ height: '200px' }} className="d-flex justify-content-center align-items-center">
                  <Doughnut
                    data={{
                      labels: [
                        t('dashboard.expenses'),
                        t('dashboard.revenue'),
                      ],
                      datasets: [
                        {
                          data: [summary.total_expenses, summary.total_revenue],
                          backgroundColor: ['rgba(220, 53, 69, 0.8)', 'rgba(25, 135, 84, 0.8)'],
                          borderColor: ['#fff', '#fff'],
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' },
                      },
                    }}
                  />
                </div>
              ) : (
                <p className="text-muted small text-center my-3">
                  <i className="bi bi-info-circle me-1"></i>
                  {t('dashboard.logExpensesToViewChart')}
                </p>
              )}
            </div>
          </div>

          {/* Season Breakdown */}
          {season_breakdown && season_breakdown.length > 0 && (
            <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
              <div className="card-header bg-white border-bottom py-3">
                <h6 className="fw-bold mb-0 text-dark">
                  <i className="bi bi-bar-chart-line text-success me-2"></i>
                  {t('dashboard.seasonBreakdown')}
                </h6>
              </div>
              <div className="card-body">
                {season_breakdown
                  .filter((s) => s.total_expense > 0 || s.total_revenue > 0)
                  .map((s, i) => (
                    <div key={i} className="mb-3">
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="fw-semibold">{t(`seasonLabels.${s.season}`, { defaultValue: s.season })}</span>
                        <span className={s.profit_loss >= 0 ? 'text-success' : 'text-danger'}>
                          {s.profit_loss >= 0 ? '+' : ''}₹{Number(s.profit_loss).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div
                          className={`progress-bar ${s.profit_loss >= 0 ? 'bg-success' : 'bg-danger'}`}
                          style={{ width: `${Math.min(Math.abs(s.profit_loss) / Math.max(s.total_revenue, 1) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                {season_breakdown.every((s) => s.total_expense === 0 && s.total_revenue === 0) && (
                  <p className="text-muted small text-center mb-0">
                    {t('dashboard.noSeasonalData')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* System Info Card */}
          <div className="card border-0 shadow-sm rounded-4 bg-fms-primary text-white p-4">
            <div className="d-flex align-items-center gap-3">
              <i className="bi bi-shield-check fs-1 opacity-75"></i>
              <div>
                <h6 className="fw-bold mb-1">{t('navigation.brand')}</h6>
                <p className="small mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {t('common.agriTechPlatform')}
                </p>
                <p className="small mb-0" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {t('common.farmersEmpower')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
